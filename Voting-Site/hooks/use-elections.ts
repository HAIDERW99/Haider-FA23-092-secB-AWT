"use client";

/**
 * useElections hook
 *
 * Fetches public elections with Supabase Realtime subscriptions
 * for live vote counting and turnout statistics on the landing page.
 */

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { Election, Candidate } from "@/lib/database.types";

export type ElectionWithCandidates = Election & {
  candidates: Candidate[];
};

interface UseElectionsOptions {
  status?: Election["status"] | Election["status"][];
  realtime?: boolean;
}

export function useElections(options: UseElectionsOptions = {}) {
  const { status, realtime = false } = options;
  const supabase = createBrowserSupabaseClient();

  const [elections, setElections] = useState<ElectionWithCandidates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from("elections")
      .select(`*, candidates(*)`)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in("status", statuses);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setElections((data as ElectionWithCandidates[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase, status]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!realtime) return;

    const channel = supabase
      .channel("elections-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "elections",
        },
        (payload) => {
          setElections((prev) =>
            prev.map((e) =>
              e.id === payload.new.id
                ? { ...e, ...(payload.new as Election) }
                : e
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "candidates",
        },
        (payload) => {
          setElections((prev) =>
            prev.map((election) => ({
              ...election,
              candidates: election.candidates.map((c) =>
                c.id === payload.new.id
                  ? { ...c, ...(payload.new as Candidate) }
                  : c
              ),
            }))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, realtime]);

  return { elections, isLoading, error, refetch: fetchElections };
}

// ── Single election hook ───────────────────────────────────────────────────
export function useElection(electionId: string) {
  const supabase = createBrowserSupabaseClient();

  const [election, setElection] = useState<ElectionWithCandidates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElection = useCallback(async () => {
    if (!electionId) {
      setElection(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("elections")
      .select(`*, candidates(*)`)
      .eq("id", electionId)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setElection(data as ElectionWithCandidates);
    }
    setIsLoading(false);
  }, [supabase, electionId]);

  useEffect(() => {
    fetchElection();
  }, [fetchElection]);

  // Realtime updates for this specific election
  useEffect(() => {
    const channel = supabase
      .channel(`election-${electionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "elections",
          filter: `id=eq.${electionId}`,
        },
        (payload) => {
          setElection((prev) =>
            prev ? { ...prev, ...(payload.new as Election) } : null
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "candidates",
          filter: `election_id=eq.${electionId}`,
        },
        (payload) => {
          setElection((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              candidates: prev.candidates.map((c) =>
                c.id === payload.new.id
                  ? { ...c, ...(payload.new as Candidate) }
                  : c
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, electionId]);

  return { election, isLoading, error, refetch: fetchElection };
}

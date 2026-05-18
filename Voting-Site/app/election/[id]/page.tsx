export const dynamic = "force-dynamic";

import { createServerSupabaseClient } from "@/lib/supabase.server";
import type { ElectionWithCandidates } from "@/hooks/use-elections";
import ElectionClient from "./page-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ElectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) {
    return <ElectionClient id="" election={null} fetchError="Missing election ID" />;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("elections")
    .select("*, candidates(*)")
    .eq("id", id)
    .maybeSingle();

  const election = (data as ElectionWithCandidates | null) ?? null;

  return (
    <ElectionClient
      id={id}
      election={election}
      fetchError={error?.message ?? null}
    />
  );
}

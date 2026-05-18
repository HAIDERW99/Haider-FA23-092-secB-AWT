"use client";
/**
 * Supabase BROWSER client - safe for Client Components
 * No next/headers, no server-only APIs
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createBrowserSupabaseClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(URL, KEY);
  }
  return _client;
}

"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/compartido/supabase";

let cliente: SupabaseClient | null = null;

/** Cliente del navegador. En el panel usa la sesión de la propietaria para subir archivos. */
export function clienteNavegador(): SupabaseClient {
  if (!cliente) cliente = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cliente;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/compartido/supabase";

let cliente: SupabaseClient | null = null;

/** Cliente público, sin sesión. Las reglas RLS solo dejan ver lo publicado. */
export function clientePublico(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

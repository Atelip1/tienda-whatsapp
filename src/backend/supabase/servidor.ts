import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/compartido/supabase";

/** Cliente con la sesión de la propietaria (cookies). Úsalo en el panel y en las acciones. */
export async function clienteServidor() {
  const almacen = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Se llamó desde un componente de servidor: el middleware ya renueva la sesión.
        }
      },
    },
  });
}

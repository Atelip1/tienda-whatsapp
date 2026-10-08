import { redirect } from "next/navigation";
import { cerrarSesion } from "@/backend/acciones";
import { AvisosProvider } from "@/frontend/componentes/Avisos";
import { Inactividad } from "@/frontend/componentes/admin/Inactividad";
import { MenuPanel } from "@/frontend/componentes/admin/MenuPanel";
import { Logo } from "@/frontend/componentes/Logo";
import { clienteServidor } from "@/backend/supabase/servidor";
import { STOCK_BAJO } from "@/compartido/config/tienda";

export const dynamic = "force-dynamic";

/** RF-13: sin sesión de propietaria no se muestra ninguna página del panel. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sb = await clienteServidor();
  const { data: sesion } = await sb.auth.getClaims();
  const claims = sesion?.claims;
  if (!claims?.sub) redirect("/admin/login");
  const user = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
  const [{ data: admin }, { data: inventario }] = await Promise.all([
    sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    sb.from("products").select("stock, status"),
  ]);
  if (!admin) {
    await sb.auth.signOut();
    redirect("/admin/login");
  }
  const alertas = (inventario ?? []).filter((p) => p.status !== "oculto" && p.stock <= STOCK_BAJO).length;
  return (
    <AvisosProvider soloErrores>
      <Inactividad />
      <div className="admin">
        <aside className="side">
          <div className="brand">
            <Logo variante="panel" />
            <small>Panel de administración</small>
          </div>
          <MenuPanel alertas={alertas} />
          <div className="bottom">
            <div className="userbox">
              <span className="avatar" aria-hidden>
                {(user.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <div>
                <b>Propietaria</b>
                <small>{user.email}</small>
              </div>
            </div>
            <form action={cerrarSesion}>
              <button className="btn btn-ghost btn-sm" type="submit" style={{ width: "100%" }}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>
        <main className="amain">{children}</main>
      </div>
    </AvisosProvider>
  );
}

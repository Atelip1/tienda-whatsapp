import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESION_MINUTOS } from "@/compartido/config/tienda";

const COOKIE_ACTIVIDAD = "panel_actividad";

/**
 * 1) Subdominio: admin.tudominio.pe/* se sirve desde /admin/*. En el dominio de la tienda, /admin no existe.
 * 2) RF-13: sin sesión no se entra a ninguna ruta del panel.
 * 3) RNF-06: la sesión se cierra tras 60 minutos sin actividad.
 */
export async function proteger(req: NextRequest) {
  const adminHost = (process.env.ADMIN_HOST ?? "").toLowerCase().trim();
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const url = req.nextUrl.clone();
  const enSubdominio = Boolean(adminHost) && host === adminHost;
  let ruta = url.pathname;

  if (enSubdominio && !ruta.startsWith("/admin")) {
    ruta = ruta === "/" ? "/admin" : "/admin" + ruta;
  }
  if (adminHost && !enSubdominio && ruta.startsWith("/admin")) {
    url.pathname = "/no-existe";
    return NextResponse.rewrite(url);
  }
  if (!ruta.startsWith("/admin")) return NextResponse.next();

  url.pathname = ruta;
  const reescrita = ruta !== req.nextUrl.pathname;
  let res = reescrita ? NextResponse.rewrite(url) : NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(lista) {
          lista.forEach(({ name, value }) => req.cookies.set(name, value));
          res = reescrita ? NextResponse.rewrite(url, { request: req }) : NextResponse.next({ request: req });
          lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims verifica la firma de la sesión sin ir al servidor de Supabase en cada clic (más rápido).
  const { data: sesion } = await supabase.auth.getClaims();
  const user = sesion?.claims?.sub ? { id: sesion.claims.sub } : null;

  const esLogin = ruta === "/admin/login";
  const ir = (destino: string, busqueda = "") => {
    // Se usa el host real (por ejemplo admin.tudominio.pe) para no salir del subdominio.
    const hostReal = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    const salida = NextResponse.redirect(new URL(destino + busqueda, `${proto}://${hostReal}`));
    res.cookies.getAll().forEach((c) => salida.cookies.set(c));
    return salida;
  };

  if (user) {
    const actividad = req.cookies.get(COOKIE_ACTIVIDAD)?.value;
    const vencida = !actividad || Date.now() - Number(actividad) > SESION_MINUTOS * 60_000;
    if (vencida && !esLogin) {
      await supabase.auth.signOut();
      const salida = ir("/admin/login", "?expirada=1");
      salida.cookies.delete(COOKIE_ACTIVIDAD);
      return salida;
    }
    if (esLogin && !vencida) return ir("/admin/inicio");
    if (!vencida) {
      res.cookies.set(COOKIE_ACTIVIDAD, String(Date.now()), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESION_MINUTOS * 60,
        path: "/",
      });
    }
    return res;
  }

  if (!esLogin) return ir("/admin/login");
  return res;
}

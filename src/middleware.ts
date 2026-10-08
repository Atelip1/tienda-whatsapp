import type { NextRequest } from "next/server";
import { proteger } from "@/backend/seguridad";

/**
 * Next.js exige que este archivo esté en src/. La lógica está en src/backend/seguridad.ts:
 * subdominio del panel, sesión obligatoria y cierre tras 60 minutos sin actividad.
 */
export function middleware(req: NextRequest) {
  return proteger(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};

"use client";
import { useEffect, useRef } from "react";
import { mantenerSesion } from "@/backend/acciones";
import { SESION_MINUTOS } from "@/compartido/config/tienda";

/** RNF-06: cierra la sesión tras 60 minutos sin actividad y la mantiene viva mientras la propietaria trabaja. */
export function Inactividad() {
  const ultima = useRef(Date.now());
  const avisada = useRef(Date.now());

  useEffect(() => {
    const marcar = () => (ultima.current = Date.now());
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    const t = setInterval(async () => {
      const ahora = Date.now();
      if (ahora - ultima.current > SESION_MINUTOS * 60_000) {
        window.location.href = "/admin/login?expirada=1";
        return;
      }
      // Si hubo actividad desde el último aviso, renovamos la cookie en el servidor.
      if (ultima.current > avisada.current && ahora - avisada.current > 4 * 60_000) {
        avisada.current = ahora;
        const viva = await mantenerSesion();
        if (!viva) window.location.href = "/admin/login?expirada=1";
      }
    }, 30_000);
    return () => {
      clearInterval(t);
      eventos.forEach((e) => window.removeEventListener(e, marcar));
    };
  }, []);
  return null;
}

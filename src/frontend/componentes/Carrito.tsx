"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clienteNavegador } from "@/frontend/lib/supabase-navegador";
import { supabaseConfigurado } from "@/compartido/supabase";
import type { LineaCarrito } from "@/compartido/tipos";

const CLAVE = "carrito-v1";

type CarritoCtx = {
  lineas: LineaCarrito[];
  listo: boolean;
  cantidadTotal: number;
  /** Suma la cantidad sin duplicar la línea (RF-08). Devuelve las unidades realmente agregadas. */
  agregar: (id: string, qty: number, stock: number) => number;
  fijar: (id: string, qty: number) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
  whatsapp: string;
};

const Ctx = createContext<CarritoCtx | null>(null);

function leer(): LineaCarrito[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((l) => typeof l?.id === "string" && Number(l?.qty) > 0) : [];
  } catch {
    return [];
  }
}

/** RNF-09: el carrito se guarda en el navegador y se conserva al recargar. */
export function CarritoProvider({ children, whatsapp: inicial }: { children: React.ReactNode; whatsapp: string }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [whatsapp, setWhatsapp] = useState(inicial);

  // RF-20: se consulta el número vigente al abrir la tienda, así un cambio en el panel se usa de inmediato.
  useEffect(() => {
    if (!supabaseConfigurado) return;
    clienteNavegador()
      .from("settings")
      .select("whatsapp")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => data?.whatsapp && setWhatsapp(data.whatsapp));
  }, []);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setLineas(leer());
    setListo(true);
    const sync = (e: StorageEvent) => e.key === CLAVE && setLineas(leer());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lineas));
    } catch {}
  }, [lineas, listo]);

  const agregar = useCallback(
    (id: string, qty: number, stock: number) => {
      const actual = lineas.find((l) => l.id === id)?.qty ?? 0;
      const nueva = Math.min(stock, actual + qty);
      const agregadas = Math.max(0, nueva - actual);
      if (agregadas > 0) {
        setLineas((ls) =>
          ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: nueva } : l)) : [...ls, { id, qty: nueva }],
        );
      }
      return agregadas;
    },
    [lineas],
  );
  const fijar = useCallback((id: string, qty: number) => {
    setLineas((ls) => ls.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)));
  }, []);
  const quitar = useCallback((id: string) => setLineas((ls) => ls.filter((l) => l.id !== id)), []);
  const vaciar = useCallback(() => setLineas([]), []);

  const valor = useMemo(
    () => ({
      lineas,
      listo,
      cantidadTotal: lineas.reduce((a, l) => a + l.qty, 0),
      agregar,
      fijar,
      quitar,
      vaciar,
      whatsapp,
    }),
    [lineas, listo, agregar, fijar, quitar, vaciar, whatsapp],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito fuera de CarritoProvider");
  return c;
}

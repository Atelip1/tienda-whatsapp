"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Aviso = { id: number; texto: React.ReactNode; error?: boolean };
const Ctx = createContext<(texto: React.ReactNode, error?: boolean) => void>(() => {});

/**
 * `soloErrores`: no muestra mensajes de confirmación, solo los de error.
 * `silencioso`: no muestra ningún mensaje flotante (se usa en la tienda).
 */
export function AvisosProvider({
  children,
  soloErrores = false,
  silencioso = false,
}: {
  children: React.ReactNode;
  soloErrores?: boolean;
  silencioso?: boolean;
}) {
  const [lista, setLista] = useState<Aviso[]>([]);
  const avisar = useCallback((texto: React.ReactNode, error = false) => {
    if (silencioso || (soloErrores && !error)) return;
    const id = Date.now() + Math.random();
    setLista((l) => [...l, { id, texto, error }]);
    setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), error ? 4500 : 3500);
  }, [soloErrores, silencioso]);
  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div id="toast" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={"t" + (a.error ? " err" : "")}>
            {a.texto}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useAvisos = () => useContext(Ctx);

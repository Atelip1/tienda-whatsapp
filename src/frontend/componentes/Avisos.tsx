"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Aviso = { id: number; texto: React.ReactNode; error?: boolean };
const Ctx = createContext<(texto: React.ReactNode, error?: boolean) => void>(() => {});

/** `soloErrores`: no muestra mensajes de confirmación, solo los de error. */
export function AvisosProvider({ children, soloErrores = false }: { children: React.ReactNode; soloErrores?: boolean }) {
  const [lista, setLista] = useState<Aviso[]>([]);
  const avisar = useCallback((texto: React.ReactNode, error = false) => {
    if (soloErrores && !error) return;
    const id = Date.now() + Math.random();
    setLista((l) => [...l, { id, texto, error }]);
    setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), error ? 4500 : 3500);
  }, [soloErrores]);
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

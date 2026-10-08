"use client";
import { useEffect, useRef } from "react";

export function Modal({
  abierto,
  alCerrar,
  children,
  className = "",
  etiqueta,
}: {
  abierto: boolean;
  alCerrar: () => void;
  children: React.ReactNode;
  className?: string;
  etiqueta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    document.addEventListener("keydown", tecla);
    const foco = ref.current?.querySelector<HTMLElement>("[data-autofocus]") ?? ref.current;
    foco?.focus();
    return () => {
      document.removeEventListener("keydown", tecla);
      previo?.focus?.();
    };
  }, [abierto, alCerrar]);
  if (!abierto) return null;
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && alCerrar()}>
      <div ref={ref} className={"modal " + className} role="dialog" aria-modal="true" aria-label={etiqueta} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

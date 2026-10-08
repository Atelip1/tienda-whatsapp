"use client";
import { useState } from "react";
import type { Categoria, Producto } from "@/compartido/tipos";
import { TarjetaProducto } from "./TarjetaProducto";

const PUNTOS = ["#DFA0B5", "#C9936B", "#F4D7E1", "#A63D63", "#7C2848"];

/**
 * RF-02: el filtro por categoría se aplica al instante en el navegador,
 * sin volver a cargar la página.
 */
export function Catalogo({
  categorias,
  productos,
  actual: inicial,
}: {
  categorias: Categoria[];
  productos: Producto[];
  actual?: string;
}) {
  const [actual, setActual] = useState<string | undefined>(inicial);
  const lista = actual ? productos.filter((p) => p.category_id === actual) : productos;

  return (
    <>
      <nav className="chips" id="productos" aria-label="Categorías">
        <button type="button" aria-current={!actual} onClick={() => setActual(undefined)} style={{ ["--c" as string]: "var(--blue-100)" }}>
          Todo
        </button>
        {categorias.map((c, i) => (
          <button
            type="button"
            key={c.id}
            aria-current={c.id === actual}
            onClick={() => setActual(c.id)}
            style={{ ["--c" as string]: PUNTOS[i % PUNTOS.length] }}
          >
            {c.name}
          </button>
        ))}
      </nav>
      {lista.length ? (
        <div className="grid">
          {lista.map((p) => (
            <TarjetaProducto key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Aún no hay productos {actual ? "en esta categoría" : "publicados"}</h2>
          <p>{actual ? "Revisa las demás categorías del catálogo." : "Vuelve pronto para ver las novedades."}</p>
          {actual ? (
            <button className="btn btn-ghost" onClick={() => setActual(undefined)}>
              Ver todo el catálogo
            </button>
          ) : null}
        </div>
      )}
    </>
  );
}

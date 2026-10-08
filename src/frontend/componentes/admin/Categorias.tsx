"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { crearCategoria, eliminarCategoria, renombrarCategoria, visibilidadCategoria } from "@/backend/acciones";
import type { Categoria } from "@/compartido/tipos";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { IconoMas } from "@/frontend/componentes/Iconos";

type Cat = Categoria & { productos: number };
const PUNTOS = ["#DFA0B5", "#C9936B", "#F4D7E1", "#A63D63", "#7C2848"];

export function Categorias({ categorias }: { categorias: Cat[] }) {
  const [lista, setLista] = useState(categorias);
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const avisar = useAvisos();
  const router = useRouter();

  const renombrar = (c: Cat, input: HTMLInputElement) => {
    const nombre = input.value.trim();
    if (nombre === c.name) return;
    iniciar(async () => {
      const r = await renombrarCategoria(c.id, nombre);
      if (!r.ok) {
        avisar(r.error, true);
        input.value = c.name;
        return;
      }
      setLista((l) => l.map((x) => (x.id === c.id ? { ...x, name: nombre } : x)));
      avisar(`Categoría renombrada a ${nombre}.`);
    });
  };

  const visibilidad = (c: Cat, visible: boolean) => {
    const poner = (v: boolean) => setLista((l) => l.map((x) => (x.id === c.id ? { ...x, visible: v } : x)));
    poner(visible);
    iniciar(async () => {
      const r = await visibilidadCategoria(c.id, visible);
      if (!r.ok) {
        poner(!visible);
        return avisar(r.error, true);
      }
      avisar(`Categoría ${c.name} ${visible ? "visible en la tienda." : "oculta."}`);
    });
  };

  const eliminar = (c: Cat) =>
    iniciar(async () => {
      const r = await eliminarCategoria(c.id);
      if (!r.ok) return avisar(r.error, true);
      setLista((l) => l.filter((x) => x.id !== c.id));
      avisar(`Categoría ${c.name} eliminada.`);
    });

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nueva.trim()) return setError("Escribe el nombre de la categoría.");
    iniciar(async () => {
      const r = await crearCategoria(nueva);
      if (!r.ok) return setError(r.error);
      avisar(`Categoría ${nueva.trim()} agregada.`);
      setNueva("");
      setError("");
      router.refresh();
    });
  };

  return (
    <>
      <div className="ahead">
        <div>
          <h1>Categorías</h1>
          <p>Edita el nombre y presiona Enter o sal del campo para guardar.</p>
        </div>
      </div>
      <div className="catgrid">
        {lista.map((c, i) => (
          <div className={"catcard" + (c.visible ? "" : " oculta")} key={c.id}>
            <div className="cattop">
              <span className="catdot" style={{ background: PUNTOS[i % PUNTOS.length] }} aria-hidden />
              <label className="sr" htmlFor={"cn-" + c.id}>
                Nombre
              </label>
              <input
                className="inp"
                id={"cn-" + c.id}
                defaultValue={c.name}
                maxLength={60}
                onBlur={(e) => renombrar(c, e.target)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
            </div>
            <div className="catinfo">
              <span className="catcount">
                <b>{c.productos}</b> {c.productos === 1 ? "producto" : "productos"}
              </span>
              <span className={"badge " + (c.visible ? "b-Activa" : "b-Inactiva")}>{c.visible ? "En el catálogo" : "Oculta"}</span>
            </div>
            <div className="catfoot">
              <label className="switch">
                <input type="checkbox" checked={c.visible} onChange={(e) => visibilidad(c, e.target.checked)} /> Visible en la tienda
              </label>
              {c.productos === 0 ? (
                <button className="linkbtn" onClick={() => eliminar(c)}>
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <form className="catcard catnueva" onSubmit={agregar} noValidate>
          <span className="catplus" aria-hidden>
            <IconoMas />
          </span>
          <label htmlFor="nueva-cat">
            <b>Nueva categoría</b>
          </label>
          <input
            className="inp"
            id="nueva-cat"
            placeholder="Ej. Baño"
            value={nueva}
            maxLength={60}
            onChange={(e) => setNueva(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={pendiente}>
            Agregar categoría
          </button>
          <p className="err">{error}</p>
        </form>
      </div>
    </>
  );
}

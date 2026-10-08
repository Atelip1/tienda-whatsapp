"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { activarPromocion, eliminarPromocion } from "@/backend/acciones";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { IconoRegalo } from "@/frontend/componentes/Iconos";
import { Modal } from "@/frontend/componentes/Modal";
import { imagenPromo } from "@/frontend/componentes/Promociones";
import { TarjetaPromocion } from "@/frontend/componentes/TarjetaPromocion";
import { estadoPromocion, fechaCorta } from "@/compartido/formato";
import type { Promocion } from "@/compartido/tipos";

export function ListaPromociones({ promociones }: { promociones: Promocion[] }) {
  const [lista, setLista] = useState(promociones);
  const [vista, setVista] = useState<Promocion | null>(null);
  const [borrar, setBorrar] = useState<Promocion | null>(null);
  const [, iniciar] = useTransition();
  const avisar = useAvisos();
  const router = useRouter();
  const activas = lista.filter((p) => estadoPromocion(p) === "Activa");

  const activar = (p: Promocion, active: boolean) => {
    const poner = (v: boolean) => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, active: v } : x)));
    poner(active);
    iniciar(async () => {
      const r = await activarPromocion(p.id, active);
      if (!r.ok) {
        poner(!active);
        return avisar(r.error, true);
      }
      avisar(active ? "La promoción se mostrará en la tienda durante su vigencia." : "La promoción ya no se mostrará en la tienda.");
    });
  };

  const eliminar = (p: Promocion) =>
    iniciar(async () => {
      setBorrar(null);
      const r = await eliminarPromocion(p.id);
      if (!r.ok) return avisar(r.error, true);
      setLista((l) => l.filter((x) => x.id !== p.id));
      avisar("Promoción eliminada.");
      router.refresh();
    });

  return (
    <>
      <div className="ahead">
        <div>
          <h1>Promociones</h1>
          <p>Las promociones activas aparecen como ventana flotante al entrar a la tienda.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/promociones/nueva">
          Nueva promoción
        </Link>
      </div>
      <div className="current" style={{ maxWidth: "none" }}>
        <IconoRegalo className="ico28" />
        <div>
          <span className="hint">Mostrándose ahora en la tienda{activas.length > 1 ? ` (${activas.length}, en este orden)` : ""}</span>
          <br />
          <b style={{ fontSize: 17 }}>
            {activas.length
              ? activas.map((p, i) => (
                  <span key={p.id} style={{ display: "block" }}>
                    {activas.length > 1 ? `${i + 1}. ` : ""}
                    {p.title}
                  </span>
                ))
              : "Ninguna promoción activa"}
          </b>
        </div>
      </div>
      {lista.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Promoción</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>En la tienda</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const st = estadoPromocion(p);
                const img = imagenPromo(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="pcell">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {img ? <img src={img} alt="" style={{ width: 64, height: 40 }} /> : null}
                        <div>
                          {p.title}
                          <small>
                            {p.cta}
                            {p.product ? ` → ${p.product.name}` : " → catálogo"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {fechaCorta(p.start_date)}
                      <br />
                      {fechaCorta(p.end_date)}
                    </td>
                    <td>
                      <span className={`badge b-${st}`}>{st}</span>
                    </td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={p.active} onChange={(e) => activar(p, e.target.checked)} /> Mostrar
                      </label>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link className="btn btn-ghost btn-sm" href={`/admin/promociones/${p.id}`}>
                        Editar
                      </Link>{" "}
                      <button className="btn btn-ghost btn-sm" onClick={() => setVista(p)}>
                        Vista previa
                      </button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => setBorrar(p)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h2>Aún no hay promociones</h2>
          <p>Crea una para mostrarla como ventana flotante en la tienda.</p>
          <Link className="btn btn-primary" href="/admin/promociones/nueva">
            Nueva promoción
          </Link>
        </div>
      )}
      <p className="hint" style={{ marginTop: 12 }}>
        Si hay varias promociones activas, la ventana flotante las muestra todas: el cliente pasa de una a otra con las flechas, los puntos o
        deslizando en el celular. La más reciente aparece primero.
      </p>

      <Modal abierto={!!vista} alCerrar={() => setVista(null)} className="promo-modal" etiqueta="Vista previa de la promoción">
        {vista ? (
          <>
            <button className="mclose" onClick={() => setVista(null)} aria-label="Cerrar">
              ×
            </button>
            <TarjetaPromocion d={{ ...vista, imagen: imagenPromo(vista) }} boton={<span className="btn btn-wa">{vista.cta}</span>} />
          </>
        ) : null}
      </Modal>
      <Modal abierto={!!borrar} alCerrar={() => setBorrar(null)} className="mpad" etiqueta="Eliminar promoción">
        {borrar ? (
          <>
            <h2>¿Eliminar la promoción?</h2>
            <p className="hint">“{borrar.title}” dejará de mostrarse en la tienda. Esta acción no se puede deshacer.</p>
            <div className="mbtns">
              <button className="btn btn-danger" onClick={() => eliminar(borrar)}>
                Eliminar promoción
              </button>
              <button className="btn btn-ghost" data-autofocus onClick={() => setBorrar(null)}>
                Cancelar
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

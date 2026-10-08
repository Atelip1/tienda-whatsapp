"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { actualizarEstado, actualizarStock } from "@/backend/acciones";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { IconoPlay } from "@/frontend/componentes/Iconos";
import { Modal } from "@/frontend/componentes/Modal";
import { STOCK_BAJO } from "@/compartido/config/tienda";
import { dinero, kb, normalizar, tienePromo } from "@/compartido/formato";
import { BUCKET_PRODUCTOS, urlPublica } from "@/compartido/supabase";
import type { EstadoProducto, Producto } from "@/compartido/tipos";

const ESTADOS: EstadoProducto[] = ["disponible", "agotado", "oculto"];
const titulo = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type Filtro = "todos" | "disponible" | "bajo" | "agotado" | "oculto";

const FILTROS: { id: Filtro; texto: string; prueba: (p: Producto) => boolean }[] = [
  { id: "todos", texto: "Todos", prueba: () => true },
  { id: "disponible", texto: "Disponibles", prueba: (p) => p.status === "disponible" && p.stock > 0 },
  { id: "bajo", texto: "Stock bajo", prueba: (p) => p.status === "disponible" && p.stock > 0 && p.stock <= STOCK_BAJO },
  { id: "agotado", texto: "Agotados", prueba: (p) => p.status !== "oculto" && (p.status === "agotado" || p.stock === 0) },
  { id: "oculto", texto: "Ocultos", prueba: (p) => p.status === "oculto" },
];

export function TablaProductos({ productos, filtroInicial = "todos" }: { productos: Producto[]; filtroInicial?: Filtro }) {
  const [lista, setLista] = useState(productos);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [video, setVideo] = useState<Producto | null>(null);
  const [, iniciar] = useTransition();
  const avisar = useAvisos();
  const router = useRouter();

  // RF-21: búsqueda por nombre, código o categoría
  const filtrados = useMemo(() => {
    const t = normalizar(q).trim();
    const prueba = FILTROS.find((f) => f.id === filtro)!.prueba;
    return lista.filter((p) => prueba(p) && (!t || [p.name, p.code, p.category?.name ?? ""].some((x) => normalizar(x).includes(t))));
  }, [lista, q, filtro]);

  const cambiarStock = (p: Producto, valor: string, input: HTMLInputElement) => {
    const n = Number(valor);
    if (valor.trim() === "" || !Number.isInteger(n) || n < 0) {
      avisar("El stock debe ser un número entero de 0 o más.", true);
      input.value = String(p.stock);
      return;
    }
    if (n === p.stock) return;
    iniciar(async () => {
      const r = await actualizarStock(p.id, n);
      if (!r.ok) {
        avisar(r.error, true);
        input.value = String(p.stock);
        return;
      }
      setLista((l) => l.map((x) => (x.id === p.id ? { ...x, stock: n, status: r.estado as EstadoProducto } : x)));
      const nota = r.estado !== p.status ? ` Quedó como ${titulo(r.estado)}.` : "";
      avisar(`Stock de ${p.name} actualizado a ${n}.${nota}`);
      router.refresh();
    });
  };

  const cambiarEstado = (p: Producto, estado: EstadoProducto) => {
    const poner = (v: EstadoProducto) => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, status: v } : x)));
    poner(estado);
    iniciar(async () => {
      const r = await actualizarEstado(p.id, estado);
      if (!r.ok) {
        avisar(r.error, true);
        poner(p.status);
        return;
      }
      avisar(`${p.name}: ${estado}${estado === "oculto" ? ". Ya no aparece en la tienda." : "."}`);
    });
  };

  return (
    <>
      <div className="ahead">
        <div>
          <h1>Productos</h1>
          <p>
            {filtrados.length} de {lista.length} productos
          </p>
        </div>
        <Link className="btn btn-primary" href="/admin/productos/nuevo">
          Nuevo producto
        </Link>
      </div>
      <div className="filtros" role="group" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.texto} <span>{lista.filter(f.prueba).length}</span>
          </button>
        ))}
      </div>
      <div className="search">
        <label className="sr" htmlFor="buscar">
          Buscar productos
        </label>
        <input
          className="inp"
          id="buscar"
          type="search"
          placeholder="Buscar por nombre, código o categoría"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {lista.length === 0 ? (
        <div className="empty">
          <h2>Aún no hay productos</h2>
          <p>Registra el primero para que aparezca en la tienda.</p>
          <Link className="btn btn-primary" href="/admin/productos/nuevo">
            Nuevo producto
          </Link>
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Video</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                    {q ? `No hay productos que coincidan con “${q}”.` : "No hay productos en este filtro."}
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="pcell">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={urlPublica(BUCKET_PRODUCTOS, p.images[0].path)} alt="" />
                        ) : null}
                        <div>
                          {p.name}
                          <small>{p.code}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.category?.name ?? "Sin categoría"}
                      {p.category && !p.category.visible ? <span className="hint"> (oculta)</span> : null}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {tienePromo(p) ? (
                        <>
                          {dinero(p.promo_price!)}
                          <br />
                          <s className="hint">{dinero(p.price)}</s>
                        </>
                      ) : (
                        dinero(p.price)
                      )}
                    </td>
                    <td>
                      <input
                        className="stockin"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={p.stock}
                        key={p.stock}
                        aria-label={`Stock de ${p.name}`}
                        onBlur={(e) => cambiarStock(p, e.target.value, e.target)}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                    </td>
                    <td>
                      <select
                        className={`stsel s-${p.status}`}
                        value={p.status}
                        aria-label={`Estado de ${p.name}`}
                        onChange={(e) => cambiarEstado(p, e.target.value as EstadoProducto)}
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {titulo(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {p.video_path ? (
                        <button className="vpill" onClick={() => setVideo(p)} aria-label={`Ver video de ${p.name}`}>
                          <IconoPlay />
                          Ver
                        </button>
                      ) : (
                        <span className="vnone">Sin video</span>
                      )}
                    </td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" href={`/admin/productos/${p.id}`}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Modal abierto={!!video} alCerrar={() => setVideo(null)} className="vmodal" etiqueta="Video del producto">
        {video ? (
          <>
            <div className="vplayer">
              <video src={urlPublica(BUCKET_PRODUCTOS, video.video_path)} controls playsInline autoPlay />
            </div>
            <div className="mpad">
              <h2>{video.name}</h2>
              <div className="vmeta" style={{ marginTop: 8 }}>
                {video.video_name ? <span>{video.video_name}</span> : null}
                {video.video_size ? <span>{kb(video.video_size)}</span> : null}
              </div>
              <div className="mbtns" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Link className="btn btn-primary" href={`/admin/productos/${video.id}`}>
                  Cambiar video
                </Link>
                <button className="btn btn-ghost" data-autofocus onClick={() => setVideo(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

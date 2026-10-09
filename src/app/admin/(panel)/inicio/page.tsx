import type { Metadata } from "next";
import Link from "next/link";
import { NUMERO_EJEMPLO, STOCK_BAJO } from "@/compartido/config/tienda";
import { dinero, estadoPromocion, fechaCorta, hoyLima, numeroBonito, precioVigente } from "@/compartido/formato";
import { BUCKET_PRODUCTOS, urlPublica } from "@/compartido/supabase";
import { todasLasCategorias, todasLasPromociones, todosLosProductos, whatsappPanel } from "@/backend/consultas/panel";
import {
  IconoAlerta,
  IconoAtras,
  IconoCaja,
  IconoChat,
  IconoCheck,
  IconoMas,
  IconoOjoCerrado,
  IconoRegalo,
} from "@/frontend/componentes/Iconos";

export const metadata: Metadata = { title: "Inicio" };

function saludo() {
  const h = Number(new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function Inicio() {
  const [productos, categorias, promociones, whatsapp] = await Promise.all([
    todosLosProductos(),
    todasLasCategorias(),
    todasLasPromociones(),
    whatsappPanel(),
  ]);

  const visibles = productos.filter((p) => p.status !== "oculto");
  const disponibles = productos.filter((p) => p.status === "disponible" && p.stock > 0);
  const agotados = visibles.filter((p) => p.status === "agotado" || p.stock === 0);
  const bajos = visibles.filter((p) => p.status === "disponible" && p.stock > 0 && p.stock <= STOCK_BAJO);
  const ocultos = productos.filter((p) => p.status === "oculto");
  const atencion = [...agotados, ...bajos].slice(0, 6);
  const activas = promociones.filter((p) => estadoPromocion(p) === "Activa");
  const proximas = promociones.filter((p) => estadoPromocion(p) === "Programada");
  const unidades = disponibles.reduce((a, p) => a + p.stock, 0);
  const valor = disponibles.reduce((a, p) => a + p.stock * precioVigente(p), 0);

  const tarjetas = [
    { n: disponibles.length, t: "Disponibles", d: `${unidades} unidades en stock`, href: "/admin/productos?estado=disponible", Icono: IconoCaja, tono: "ok" },
    { n: bajos.length, t: "Stock bajo", d: `Con ${STOCK_BAJO} unidades o menos`, href: "/admin/productos?estado=bajo", Icono: IconoAlerta, tono: bajos.length ? "aviso" : "" },
    { n: agotados.length, t: "Agotados", d: "No se pueden comprar", href: "/admin/productos?estado=agotado", Icono: IconoAlerta, tono: agotados.length ? "alerta" : "" },
    { n: ocultos.length, t: "Ocultos", d: "No se ven en la tienda", href: "/admin/productos?estado=oculto", Icono: IconoOjoCerrado, tono: "" },
  ];

  return (
    <div className="inicio">
      <div className="ahead">
        <div>
          <h1>{saludo()}</h1>
          <p>Este es el resumen de tu tienda al {fechaCorta(hoyLima())}.</p>
        </div>
        <div className="formact" style={{ margin: 0 }}>
          <Link className="btn btn-primary" href="/admin/productos/nuevo">
            <IconoMas />
            Nuevo producto
          </Link>
          <Link className="btn btn-ghost" href="/admin/promociones/nueva">
            <IconoMas />
            Nueva promoción
          </Link>
        </div>
      </div>

      <div className="stats">
        {tarjetas.map(({ n, t, d, href, Icono, tono }) => (
          <Link key={t} href={href} className={"stat " + tono}>
            <span className="sico">
              <Icono />
            </span>
            <b>{n}</b>
            <span className="st">{t}</span>
            <span className="sd">{d}</span>
            <span className="sver">
              Ver lista
              <IconoAtras />
            </span>
          </Link>
        ))}
      </div>

      <div className="dgrid">
        <div className="dcol">
        <section className="dcard" aria-labelledby="t-atencion">
          <div className="dhead">
            <h2 id="t-atencion">Necesitan atención</h2>
            <Link href="/admin/productos?estado=bajo" className="dlink">
              Ver productos
            </Link>
          </div>
          {atencion.length ? (
            <ul className="dlist">
              {atencion.map((p) => (
                <li key={p.id}>
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlPublica(BUCKET_PRODUCTOS, p.images[0].path)} alt="" />
                  ) : (
                    <span className="noimg" />
                  )}
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.code} · {dinero(precioVigente(p))}
                    </small>
                  </div>
                  <span className={"badge " + (p.stock === 0 ? "b-agotado" : "b-bajo")}>
                    {p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}
                  </span>
                  <Link className="btn btn-ghost btn-sm" href={`/admin/productos/${p.id}`}>
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dvacio">
              <IconoCheck />
              {productos.length ? "Todo en orden: ningún producto agotado ni con stock bajo." : "Cuando registres productos, aquí verás los que se están acabando."}
            </p>
          )}
        </section>
          <section className="dcard dnum" aria-label="Catálogo">
            <div>
              <b>{productos.length}</b>
              <span>productos</span>
            </div>
            <div>
              <b>{categorias.filter((c) => c.visible).length}</b>
              <span>categorías visibles</span>
            </div>
            <div>
              <b>{dinero(valor)}</b>
              <span>valor del stock disponible</span>
            </div>
          </section>
        </div>

        <div className="dcol">
          <section className="dcard" aria-labelledby="t-promos">
            <div className="dhead">
              <h2 id="t-promos">Promociones</h2>
              <Link href="/admin/promociones" className="dlink">
                Gestionar
              </Link>
            </div>
            {activas.length ? (
              <ul className="dmini">
                {activas.map((p) => (
                  <li key={p.id}>
                    <IconoRegalo />
                    <div>
                      <b>{p.title}</b>
                      <small>Hasta el {fechaCorta(p.end_date)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dvacio sin">No hay promociones activas en la tienda.</p>
            )}
            {proximas.length ? (
              <p className="hint" style={{ margin: "10px 0 0" }}>
                {proximas.length} programada{proximas.length > 1 ? "s" : ""}: empieza{proximas.length > 1 ? "n" : ""} el {fechaCorta(proximas[0].start_date)}.
              </p>
            ) : null}
          </section>

          <section className="dcard" aria-labelledby="t-wa">
            <div className="dhead">
              <h2 id="t-wa">WhatsApp de pedidos</h2>
              <Link href="/admin/whatsapp" className="dlink">
                Cambiar
              </Link>
            </div>
            <div className="dwa">
              <IconoChat />
              <b>{whatsapp ? numeroBonito(whatsapp) : "Sin configurar"}</b>
            </div>
            {whatsapp === NUMERO_EJEMPLO ? (
              <p className="dnota">Es el número de ejemplo. Cámbialo por el de la tienda para recibir los pedidos.</p>
            ) : null}
          </section>

        </div>
      </div>
    </div>
  );
}

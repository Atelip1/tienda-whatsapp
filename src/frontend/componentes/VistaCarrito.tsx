"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dinero, enlaceWhatsApp, mensajePedido, precioVigente, sePuedeComprar } from "@/compartido/formato";
import { clienteNavegador } from "@/frontend/lib/supabase-navegador";
import { BUCKET_PRODUCTOS, supabaseConfigurado, urlPublica } from "@/compartido/supabase";
import type { Producto } from "@/compartido/tipos";
import { useAvisos } from "./Avisos";
import { useCarrito } from "./Carrito";
import { IconoChat } from "./Iconos";
import { Modal } from "./Modal";
import { Precio } from "./TarjetaProducto";

const SELECT =
  "id, code, name, description, price, promo_price, stock, status, category_id, video_path, video_name, video_size, images:product_images(id, path, position)";

export function VistaCarrito() {
  const { lineas, listo, fijar, quitar, vaciar, whatsapp } = useCarrito();
  const avisar = useAvisos();
  const [productos, setProductos] = useState<Record<string, Producto>>({});
  const [cargando, setCargando] = useState(true);
  const [confirmar, setConfirmar] = useState(false);
  const ids = useMemo(() => lineas.map((l) => l.id).sort().join(","), [lineas]);

  // RF-09: precios y stock vigentes, consultados cada vez que cambia el carrito
  useEffect(() => {
    if (!listo) return;
    if (!ids || !supabaseConfigurado) {
      setCargando(false);
      return;
    }
    let vivo = true;
    clienteNavegador()
      .from("products")
      .select(SELECT)
      .in("id", ids.split(","))
      .then(({ data }) => {
        if (!vivo) return;
        const mapa: Record<string, Producto> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).forEach((r: any) => {
          mapa[r.id] = {
            ...r,
            price: Number(r.price),
            promo_price: r.promo_price == null ? null : Number(r.promo_price),
            images: [...(r.images ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position),
          };
        });
        setProductos(mapa);
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [ids, listo]);

  if (!listo || (cargando && lineas.length)) return <p className="hint">Cargando tu carrito…</p>;

  if (!lineas.length)
    return (
      <div className="empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos desde el catálogo y envíanos tu pedido completo por WhatsApp.</p>
        <Link className="btn btn-primary" href="/">
          Ver catálogo
        </Link>
      </div>
    );

  const filas = lineas.map((l) => ({ l, p: productos[l.id] as Producto | undefined }));
  const validas = filas.filter((f) => f.p && sePuedeComprar(f.p)) as { l: (typeof lineas)[0]; p: Producto }[];
  const total = validas.reduce((a, { l, p }) => a + precioVigente(p) * Math.min(l.qty, p.stock), 0);

  const cambiar = (id: string, valor: number, stock: number) => {
    if (!Number.isFinite(valor) || valor < 1) {
      avisar("La cantidad mínima es 1.", true);
      valor = 1;
    } else if (valor > stock) {
      avisar(`Solo hay ${stock} unidades disponibles.`, true);
      valor = stock;
    }
    fijar(id, Math.round(valor));
  };

  // RF-11 / RN-03: el pedido lista cada producto disponible; no reserva stock
  const enviar = () => {
    if (!whatsapp) {
      avisar("La tienda aún no configuró su número de WhatsApp.", true);
      return;
    }
    const msg = mensajePedido(validas.map(({ l, p }) => ({ p, qty: Math.min(l.qty, p.stock) })));
    window.open(enlaceWhatsApp(whatsapp, msg), "_blank", "noopener");
  };

  return (
    <div className="cart">
      <div>
        <h1>Tu carrito</h1>
        <div className="lines">
          {filas.map(({ l, p }) => {
            if (!p || !sePuedeComprar(p))
              return (
                <div className="line gone" key={l.id}>
                  {p?.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlPublica(BUCKET_PRODUCTOS, p.images[0].path)} alt="" />
                  ) : (
                    <span />
                  )}
                  <div>
                    <div className="name">{p?.name ?? "Producto retirado"}</div>
                    <div className="warn">Ya no está disponible. No se incluirá en el pedido.</div>
                  </div>
                  <div className="row">
                    <span />
                    <button className="btn btn-ghost btn-sm" onClick={() => quitar(l.id)}>
                      Quitar
                    </button>
                  </div>
                </div>
              );
            const qty = Math.min(l.qty, p.stock);
            return (
              <div className="line" key={l.id}>
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlPublica(BUCKET_PRODUCTOS, p.images[0].path)} alt="" />
                ) : (
                  <span />
                )}
                <div>
                  <div className="name">
                    <Link href={`/producto/${p.id}`}>{p.name}</Link>
                  </div>
                  <Precio p={p} />
                </div>
                <div className="row">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="stepper">
                      <button onClick={() => cambiar(p.id, qty - 1, p.stock)} disabled={qty <= 1} aria-label="Quitar una unidad">
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={p.stock}
                        key={qty}
                        defaultValue={qty}
                        aria-label={`Cantidad de ${p.name}`}
                        onBlur={(e) => Number(e.target.value) !== qty && cambiar(p.id, Number(e.target.value), p.stock)}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                      <button
                        onClick={() => cambiar(p.id, qty + 1, p.stock)}
                        disabled={qty >= p.stock}
                        aria-label="Agregar una unidad"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        quitar(p.id);
                        avisar(`Quitado del carrito: ${p.name}`);
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                  <span className="sub">{dinero(precioVigente(p) * qty)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <aside className="summary">
        <div className="tot">
          <span>Total referencial</span>
          <b>{dinero(total)}</b>
        </div>
        <p>No incluye delivery. La disponibilidad y el monto final se confirman por WhatsApp.</p>
        <button className="btn btn-wa" onClick={enviar} disabled={!validas.length}>
          <IconoChat />
          Enviar pedido por WhatsApp
        </button>
        <Link className="btn btn-ghost" href="/">
          Seguir comprando
        </Link>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmar(true)}>
          Vaciar carrito
        </button>
      </aside>
      <Modal abierto={confirmar} alCerrar={() => setConfirmar(false)} className="mpad" etiqueta="Vaciar el carrito">
        <h2>¿Vaciar el carrito?</h2>
        <p className="hint">Se quitarán todos los productos. Esta acción no se puede deshacer.</p>
        <div className="mbtns">
          <button
            className="btn btn-danger"
            onClick={() => {
              vaciar();
              setConfirmar(false);
              avisar("Carrito vaciado.");
            }}
          >
            Vaciar carrito
          </button>
          <button className="btn btn-ghost" data-autofocus onClick={() => setConfirmar(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dinero, enlaceWhatsApp, mensajeCompraAhora, sePuedeComprar, tienePromo } from "@/compartido/formato";
import { clienteNavegador } from "@/frontend/lib/supabase-navegador";
import { supabaseConfigurado } from "@/compartido/supabase";
import type { Producto } from "@/compartido/tipos";
import { useAvisos } from "./Avisos";
import { useCarrito } from "./Carrito";
import { IconoCarrito, IconoChat, IconoCheck } from "./Iconos";
import { Precio } from "./TarjetaProducto";

export function Comprar({ p: inicial, children }: { p: Producto; children?: React.ReactNode }) {
  const [p, setP] = useState(inicial);

  // Se confirma stock, estado y precio vigentes al abrir la página (la página puede venir de caché).
  useEffect(() => {
    if (!supabaseConfigurado) return;
    clienteNavegador()
      .from("products")
      .select("stock, status, price, promo_price")
      .eq("id", inicial.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        setP((x) =>
          data
            ? { ...x, stock: data.stock, status: data.status, price: Number(data.price), promo_price: data.promo_price == null ? null : Number(data.promo_price) }
            : { ...x, status: "oculto" },
        );
      });
  }, [inicial.id]);

  const disponible = sePuedeComprar(p);
  const [qty, setQty] = useState(1);
  const [texto, setTexto] = useState("1");
  const { agregar, whatsapp, lineas } = useCarrito();
  const avisar = useAvisos();

  // RF-06: no menos de 1 ni más que el stock
  const fijar = (n: number) => {
    let v = Math.round(n);
    if (!Number.isFinite(v) || v < 1) {
      v = 1;
      avisar("La cantidad mínima es 1.", true);
    } else if (v > p.stock) {
      v = p.stock;
      avisar(`Solo hay ${p.stock} unidades disponibles.`, true);
    }
    setQty(v);
    setTexto(String(v));
  };

  // RF-07 / RNF-07: abre WhatsApp directamente (app en el celular, WhatsApp Web en la PC)
  const comprarAhora = () => {
    if (!whatsapp) {
      avisar("La tienda aún no configuró su número de WhatsApp.", true);
      return;
    }
    window.open(enlaceWhatsApp(whatsapp, mensajeCompraAhora(p, qty)), "_blank", "noopener");
  };

  // RF-08: suma sin duplicar la línea y confirma
  // La confirmación se ve en el mismo botón (sin mensajes flotantes).
  const [agregado, setAgregado] = useState<"" | "ok" | "max">("");
  const alCarrito = () => {
    const n = agregar(p.id, qty, p.stock);
    setAgregado(n === 0 ? "max" : "ok");
    setTimeout(() => setAgregado(""), 1800);
  };
  const enCarrito = lineas.find((l) => l.id === p.id)?.qty ?? 0;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <Precio p={p} />
        {tienePromo(p) ? <span className="save">Ahorras {dinero(p.price - p.promo_price!)}</span> : null}
      </div>
      <div>
        <span className={"avail" + (disponible ? "" : " out")}>
          <i />
          {disponible ? `Disponible: ${p.stock} ${p.stock === 1 ? "unidad" : "unidades"}` : "Agotado"}
        </span>
      </div>
      {children}
      <div className="qty">
        <label htmlFor="cantidad">Cantidad</label>
        <div className="stepper">
          <button type="button" onClick={() => fijar(qty - 1)} disabled={!disponible || qty <= 1} aria-label="Quitar una unidad">
            −
          </button>
          <input
            id="cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            max={p.stock}
            value={disponible ? texto : 0}
            disabled={!disponible}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => fijar(Number(texto))}
            onKeyDown={(e) => e.key === "Enter" && fijar(Number(texto))}
          />
          <button
            type="button"
            onClick={() => fijar(qty + 1)}
            disabled={!disponible || qty >= p.stock}
            aria-label="Agregar una unidad"
          >
            +
          </button>
        </div>
        {disponible ? <span className="hint">Máximo {p.stock}</span> : null}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-wa" onClick={comprarAhora} disabled={!disponible}>
          <IconoChat />
          Comprar ahora
        </button>
        <button
          type="button"
          className={"btn btn-outline" + (agregado ? " hecho" : "")}
          onClick={alCarrito}
          disabled={!disponible}
          aria-live="polite"
        >
          {agregado === "ok" ? <IconoCheck /> : <IconoCarrito />}
          {agregado === "ok" ? "Agregado al carrito" : agregado === "max" ? "Ya tienes todo el stock" : "Agregar al carrito"}
        </button>
      </div>
      <p className="note">
        {disponible
          ? "El pago y la entrega se coordinan con la tienda por WhatsApp."
          : "Este producto está agotado. Escríbenos para saber cuándo vuelve o revisa otros productos."}
        {disponible && enCarrito > 0 ? (
          <>
            {" "}
            Tienes {enCarrito} en tu <Link href="/carrito">carrito</Link>.
          </>
        ) : null}
      </p>
    </>
  );
}

import { TIENDA } from "@/compartido/config/tienda";
import type { Producto } from "./tipos";

const soles = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** RNF-11: precios en soles con dos decimales. */
export function dinero(n: number): string {
  return "S/ " + soles.format(Number(n) || 0);
}

/** RN-07: si hay precio promocional válido, se usa ese. */
export function precioVigente(p: Pick<Producto, "price" | "promo_price">): number {
  return p.promo_price != null && p.promo_price > 0 && p.promo_price < p.price ? p.promo_price : p.price;
}

export function tienePromo(p: Pick<Producto, "price" | "promo_price">): boolean {
  return p.promo_price != null && p.promo_price > 0 && p.promo_price < p.price;
}

/** RN-06: no se compra si está agotado, oculto o sin stock. */
export function sePuedeComprar(p: Pick<Producto, "status" | "stock">): boolean {
  return p.status === "disponible" && p.stock > 0;
}

export function numeroBonito(n: string): string {
  if (!/^\d{11}$/.test(n)) return "+" + n;
  return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}

/** SP-06: enlace wa.me. Abre la app en el celular y WhatsApp Web en la PC. */
export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeCompraAhora(p: Producto, cantidad: number): string {
  const unit = precioVigente(p);
  return [
    TIENDA.mensajes.saludoCompra,
    "",
    `Código: ${p.code}`,
    `Producto: ${p.name}`,
    `Cantidad: ${cantidad}`,
    `Precio unitario: ${dinero(unit)}`,
    `Total: ${dinero(unit * cantidad)}`,
    "",
    TIENDA.mensajes.cierre,
  ].join("\n");
}

export function mensajePedido(lineas: { p: Producto; qty: number }[]): string {
  let total = 0;
  const cuerpo = lineas.map(({ p, qty }, i) => {
    const sub = precioVigente(p) * qty;
    total += sub;
    return `${i + 1}. [${p.code}] ${p.name}\n   Cantidad: ${qty} × ${dinero(precioVigente(p))} = ${dinero(sub)}`;
  });
  return [
    TIENDA.mensajes.saludoPedido,
    "",
    ...cuerpo,
    "",
    `Total referencial: ${dinero(total)}`,
    "(No incluye delivery)",
    "",
    TIENDA.mensajes.cierre,
  ].join("\n");
}

/** Fecha de hoy en Lima, AAAA-MM-DD. */
export function hoyLima(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function estadoPromocion(pr: { active: boolean; start_date: string; end_date: string }) {
  if (!pr.active) return "Inactiva" as const;
  const hoy = hoyLima();
  if (hoy < pr.start_date) return "Programada" as const;
  if (hoy > pr.end_date) return "Vencida" as const;
  return "Activa" as const;
}

export function kb(bytes: number): string {
  return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

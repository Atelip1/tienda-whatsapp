import type { Metadata } from "next";
import { VistaCarrito } from "@/frontend/componentes/VistaCarrito";

export const metadata: Metadata = { title: "Tu carrito" };

export default function PaginaCarrito() {
  return <VistaCarrito />;
}

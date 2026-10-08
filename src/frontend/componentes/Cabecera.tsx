"use client";
import Link from "next/link";
import { useCarrito } from "./Carrito";
import { IconoCarrito } from "./Iconos";

export function Cabecera({ logo }: { logo: React.ReactNode }) {
  const { cantidadTotal } = useCarrito();
  return (
    <>
      <header className="shop-head">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="Ir al inicio" prefetch>
            {logo}
          </Link>
          {/* RF-12: contador del carrito */}
          <Link href="/carrito" prefetch className="cart-btn" aria-label={`Carrito: ${cantidadTotal} productos`}>
            <IconoCarrito />
            <span className="hide-sm">Carrito</span>
            <span className="cart-count">{cantidadTotal}</span>
          </Link>
        </div>
      </header>
      <div className="bunting" aria-hidden />
    </>
  );
}

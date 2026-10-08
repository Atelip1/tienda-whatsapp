import Link from "next/link";
import { BUCKET_PRODUCTOS, urlPublica } from "@/compartido/supabase";
import { dinero, sePuedeComprar, tienePromo } from "@/compartido/formato";
import type { Producto } from "@/compartido/tipos";

export function Precio({ p }: { p: Pick<Producto, "price" | "promo_price"> }) {
  if (tienePromo(p))
    return (
      <div className="price promo">
        <span className="now">{dinero(p.promo_price!)}</span>
        <s>{dinero(p.price)}</s>
      </div>
    );
  return (
    <div className="price">
      <span className="now">{dinero(p.price)}</span>
    </div>
  );
}

export function TarjetaProducto({ p }: { p: Producto }) {
  const agotado = !sePuedeComprar(p);
  const img = p.images[0];
  return (
    <Link className={"card" + (agotado ? " out" : "")} href={`/producto/${p.id}`} prefetch>
      <div className="ph">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlPublica(BUCKET_PRODUCTOS, img.path)} alt="" loading="lazy" width={400} height={400} />
        ) : null}
        {agotado ? (
          <span className="tag out">Agotado</span>
        ) : tienePromo(p) ? (
          <span className="tag promo">−{Math.round((1 - p.promo_price! / p.price) * 100)}%</span>
        ) : null}
      </div>
      <div className="cbody">
        <h3>{p.name}</h3>
        <Precio p={p} />
      </div>
    </Link>
  );
}

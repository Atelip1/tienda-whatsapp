import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Comprar } from "@/frontend/componentes/Comprar";
import { Galeria } from "@/frontend/componentes/Galeria";
import { IconoAtras } from "@/frontend/componentes/Iconos";
import { productoPublico } from "@/backend/consultas/tienda";
import { BUCKET_PRODUCTOS, urlPublica } from "@/compartido/supabase";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await productoPublico((await params).id);
  if (!p) return { title: "Producto" };
  const img = p.images[0] ? urlPublica(BUCKET_PRODUCTOS, p.images[0].path) : undefined;
  return { title: p.name, description: p.description.slice(0, 150), openGraph: { images: img ? [img] : [] } };
}

export default async function PaginaProducto({ params }: Props) {
  const p = await productoPublico((await params).id);
  if (!p) notFound();
  const cat = p.category;
  return (
    <>
      <nav className="crumbs" aria-label="Ruta de navegación">
        <Link className="backbtn" href={cat ? `/categoria/${cat.id}#productos` : "/"} prefetch>
          <IconoAtras />
          Volver a {cat?.name ?? "la tienda"}
        </Link>
        <ol>
          <li>
            <Link href="/">Catálogo</Link>
          </li>
          {cat ? (
            <li>
              <Link href={`/categoria/${cat.id}#productos`}>{cat.name}</Link>
            </li>
          ) : null}
          <li aria-current="page">{p.name}</li>
        </ol>
      </nav>
      <div className="detail">
        <Galeria
          nombre={p.name}
          imagenes={p.images.map((i) => urlPublica(BUCKET_PRODUCTOS, i.path))}
          video={p.video_path ? urlPublica(BUCKET_PRODUCTOS, p.video_path) : null}
        />
        <div className="info">
          <h1>{p.name}</h1>
          <Comprar p={p}>
            <p className="desc" style={{ whiteSpace: "pre-line" }}>
              {p.description}
            </p>
          </Comprar>
        </div>
      </div>
    </>
  );
}

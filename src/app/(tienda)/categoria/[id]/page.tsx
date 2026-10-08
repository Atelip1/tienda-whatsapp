import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalogo } from "@/frontend/componentes/Catalogo";
import { Portada } from "@/frontend/componentes/Portada";
import { categoriasPublicas, productosPublicos } from "@/backend/consultas/tienda";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = (await categoriasPublicas()).find((x) => x.id === id);
  return { title: c?.name ?? "Categoría" };
}

export default async function PaginaCategoria({ params }: Props) {
  const { id } = await params;
  const categorias = await categoriasPublicas();
  if (!categorias.some((c) => c.id === id)) notFound();
  const productos = await productosPublicos(id);
  return (
    <>
      <Portada />
      <Catalogo categorias={categorias} productos={productos} actual={id} />
    </>
  );
}

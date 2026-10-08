import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioProducto } from "@/frontend/componentes/admin/FormularioProducto";
import { productoPanel, todasLasCategorias } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, categorias] = await Promise.all([productoPanel(id), todasLasCategorias()]);
  if (!producto) notFound();
  return <FormularioProducto producto={producto} categorias={categorias} idNuevo={producto.id} />;
}

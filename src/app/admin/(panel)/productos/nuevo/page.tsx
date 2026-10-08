import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { FormularioProducto } from "@/frontend/componentes/admin/FormularioProducto";
import { todasLasCategorias } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto() {
  const categorias = await todasLasCategorias();
  return <FormularioProducto producto={null} categorias={categorias} idNuevo={randomUUID()} />;
}

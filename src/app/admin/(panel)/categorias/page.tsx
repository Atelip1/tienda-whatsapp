import type { Metadata } from "next";
import { Categorias } from "@/frontend/componentes/admin/Categorias";
import { todasLasCategorias } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Categorías" };

export default async function PaginaCategorias() {
  const categorias = await todasLasCategorias();
  return <Categorias key={categorias.map((c) => c.id + c.name + c.visible).join()} categorias={categorias} />;
}

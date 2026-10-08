import type { Metadata } from "next";
import { todosLosProductos } from "@/backend/consultas/panel";
import { TablaProductos, type Filtro } from "@/frontend/componentes/admin/TablaProductos";

export const metadata: Metadata = { title: "Productos" };

const VALIDOS: Filtro[] = ["todos", "disponible", "bajo", "agotado", "oculto"];

export default async function Productos({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const [{ estado }, productos] = await Promise.all([searchParams, todosLosProductos()]);
  const filtro = VALIDOS.includes(estado as Filtro) ? (estado as Filtro) : "todos";
  return <TablaProductos key={filtro} productos={productos} filtroInicial={filtro} />;
}

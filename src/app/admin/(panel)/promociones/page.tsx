import type { Metadata } from "next";
import { ListaPromociones } from "@/frontend/componentes/admin/ListaPromociones";
import { todasLasPromociones } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Promociones" };

export default async function PaginaPromociones() {
  const promociones = await todasLasPromociones();
  return <ListaPromociones key={promociones.map((p) => p.id + p.active).join()} promociones={promociones} />;
}

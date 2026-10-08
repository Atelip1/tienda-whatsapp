import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { FormularioPromocion } from "@/frontend/componentes/admin/FormularioPromocion";
import { todosLosProductos } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Nueva promoción" };

export default async function NuevaPromocion() {
  const productos = (await todosLosProductos()).filter((p) => p.status !== "oculto");
  return <FormularioPromocion promo={null} productos={productos} idNuevo={randomUUID()} />;
}

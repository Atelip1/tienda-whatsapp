import type { Metadata } from "next";
import { FormularioWhatsApp } from "@/frontend/componentes/admin/FormularioWhatsApp";
import { whatsappPanel } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Número de WhatsApp" };

export default async function PaginaWhatsApp() {
  return <FormularioWhatsApp actual={await whatsappPanel()} />;
}

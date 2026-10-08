import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioPromocion } from "@/frontend/componentes/admin/FormularioPromocion";
import { todasLasPromociones, todosLosProductos } from "@/backend/consultas/panel";

export const metadata: Metadata = { title: "Editar promoción" };

export default async function EditarPromocion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promos, productos] = await Promise.all([todasLasPromociones(), todosLosProductos()]);
  const promo = promos.find((p) => p.id === id);
  if (!promo) notFound();
  return (
    <FormularioPromocion
      promo={promo}
      productos={productos.filter((p) => p.status !== "oculto" || p.id === promo.product_id)}
      idNuevo={promo.id}
    />
  );
}

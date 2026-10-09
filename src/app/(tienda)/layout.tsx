import { AvisosProvider } from "@/frontend/componentes/Avisos";
import { Cabecera } from "@/frontend/componentes/Cabecera";
import { CarritoProvider } from "@/frontend/componentes/Carrito";
import { Logo } from "@/frontend/componentes/Logo";
import { Pie } from "@/frontend/componentes/Pie";
import { Promociones } from "@/frontend/componentes/Promociones";
import { numeroWhatsApp, promocionesActivas } from "@/backend/consultas/tienda";

// Siempre datos al día: los cambios del panel se ven de inmediato (RF-16, RF-17, RF-20).
export const dynamic = "force-dynamic";

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const [whatsapp, promos] = await Promise.all([numeroWhatsApp(), promocionesActivas()]);
  return (
    <CarritoProvider whatsapp={whatsapp}>
      <AvisosProvider silencioso>
        <Cabecera logo={<Logo />} />
        <main className="wrap shop-main">{children}</main>
        <Pie />
        <Promociones promos={promos} />
      </AvisosProvider>
    </CarritoProvider>
  );
}

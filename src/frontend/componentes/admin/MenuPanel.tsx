"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { IconoCaja, IconoChat, IconoEtiqueta, IconoInicio, IconoRegalo } from "@/frontend/componentes/Iconos";

const ITEMS = [
  { href: "/admin/inicio", texto: "Inicio", Icono: IconoInicio },
  { href: "/admin/productos", texto: "Productos", Icono: IconoCaja },
  { href: "/admin/categorias", texto: "Categorías", Icono: IconoEtiqueta },
  { href: "/admin/whatsapp", texto: "WhatsApp", Icono: IconoChat },
  { href: "/admin/promociones", texto: "Promociones", Icono: IconoRegalo },
];

/** Marca discretamente la opción mientras se abre (sin tapar la pantalla). */
function Contenido({ Icono, texto, extra }: { Icono: (p: { className?: string }) => React.ReactElement; texto: string; extra?: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <Icono className={"mico" + (pending ? " girando" : "")} />
      <span>{texto}</span>
      {extra}
    </>
  );
}

/** `alertas`: productos agotados o con stock bajo, para mostrar un aviso junto a "Productos". */
export function MenuPanel({ alertas = 0 }: { alertas?: number }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Panel">
      {ITEMS.map(({ href, texto, Icono }) => (
        <Link key={href} href={href} prefetch aria-current={ruta.startsWith(href) ? "page" : undefined}>
          <Contenido
            Icono={Icono}
            texto={texto}
            extra={
              href === "/admin/productos" && alertas > 0 ? (
                <span className="mbadge" aria-label={`${alertas} productos necesitan atención`}>
                  {alertas}
                </span>
              ) : null
            }
          />
        </Link>
      ))}
    </nav>
  );
}

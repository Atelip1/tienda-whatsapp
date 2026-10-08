import type { Metadata, Viewport } from "next";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@/frontend/estilos/globals.css";
import { TIENDA } from "@/compartido/config/tienda";

export const metadata: Metadata = {
  title: { default: `${TIENDA.nombre} | Catálogo`, template: `%s | ${TIENDA.nombre}` },
  description: `${TIENDA.descripcionCorta}. Pide por WhatsApp.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF8F7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

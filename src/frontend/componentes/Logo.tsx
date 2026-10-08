/**
 * Espacio reservado para el logo. Cuando tengan el logo final, define
 * NEXT_PUBLIC_LOGO_URL (o coloca el archivo en /public y usa "/logo.png").
 */
export function Logo({ variante = "cabecera" }: { variante?: "cabecera" | "pie" | "panel" | "login" }) {
  const src = process.env.NEXT_PUBLIC_LOGO_URL;
  const cls = { cabecera: "", pie: "flogo", panel: "side-logo", login: "login-logo" }[variante];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`brandlogo ${cls}`} src={src} alt="Logo de la tienda" />;
  }
  return (
    <span className={`brandlogo logo-slot ${cls}`} role="img" aria-label="Logo de la empresa">
      <b>Logo de la empresa</b>
      <small>PNG o SVG, fondo transparente</small>
    </span>
  );
}

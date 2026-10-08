import { fechaCorta } from "@/compartido/formato";

export type DatosPromo = {
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  cta: string;
  imagen: string;
};

export function TarjetaPromocion({
  d,
  etiqueta = "Promoción",
  boton,
  pie,
  idTitulo,
}: {
  d: DatosPromo;
  etiqueta?: string;
  boton: React.ReactNode;
  pie?: React.ReactNode;
  idTitulo?: string;
}) {
  return (
    <div className="promo-card">
      <div className="promo-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {d.imagen ? <img src={d.imagen} alt="" /> : null}
        <span className="promo-tag">{etiqueta}</span>
      </div>
      <div className="promo-body">
        <h2 id={idTitulo}>{d.title || "Título de la promoción"}</h2>
        <p>{d.description || "Descripción de la promoción."}</p>
        {d.start_date && d.end_date ? (
          <p className="promo-dates">
            Válido del {fechaCorta(d.start_date)} al {fechaCorta(d.end_date)}
          </p>
        ) : null}
        <div className="promo-actions">
          {boton}
          {pie}
        </div>
      </div>
    </div>
  );
}

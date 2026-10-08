import { TIENDA } from "@/compartido/config/tienda";
import { IconoChat, IconoCorazon, IconoEscudo } from "./Iconos";

const ICONOS = { corazon: IconoCorazon, escudo: IconoEscudo, chat: IconoChat };

export function Portada() {
  return (
    <>
      <section className="intro">
        <div>
          <h1>{TIENDA.portada.titulo}</h1>
          <p>{TIENDA.portada.texto}</p>
          <a className="btn btn-wa" href="#productos" style={{ marginTop: 18 }}>
            {TIENDA.portada.boton}
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="foto-portada"
          src="/portada-bebe.jpg"
          alt="Bebé sonriente envuelto en una toalla suave"
          width={940}
          height={788}
          fetchPriority="high"
        />
      </section>
      <ul className="trust" aria-label={`Por qué comprar en ${TIENDA.nombre}`}>
        {TIENDA.beneficios.map((b) => {
          const I = ICONOS[b.icono as keyof typeof ICONOS];
          return (
            <li key={b.titulo}>
              <span className="ti">
                <I />
              </span>
              <div>
                <b>{b.titulo}</b>
                <span className="tt">{b.texto}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

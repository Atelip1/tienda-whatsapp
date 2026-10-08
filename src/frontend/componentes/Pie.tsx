import { TIENDA } from "@/compartido/config/tienda";
import { Logo } from "./Logo";

export function Pie() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div>
          <Logo variante="pie" />
          <p>{TIENDA.pie.texto}</p>
        </div>
        <div className="fsteps">
          <b>Cómo comprar</b>
          <ol>
            {TIENDA.pie.pasos.map((p, i) => (
              <li key={p}>
                <span>{i + 1}</span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="wrap fcopy">
        © {new Date().getFullYear()} {TIENDA.nombre}. Precios en soles (S/). Los totales son referenciales y no incluyen
        delivery.
      </div>
    </footer>
  );
}

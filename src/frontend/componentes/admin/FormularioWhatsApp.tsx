"use client";
import { useState, useTransition } from "react";
import { guardarWhatsApp } from "@/backend/acciones";
import { numeroBonito } from "@/compartido/formato";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { IconoChat } from "@/frontend/componentes/Iconos";

export function FormularioWhatsApp({ actual }: { actual: string }) {
  const [numero, setNumero] = useState(actual);
  const [valor, setValor] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const avisar = useAvisos();

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await guardarWhatsApp(valor);
      if (!r.ok) return setError(r.error);
      setNumero(r.numero);
      setValor("");
      setError("");
      avisar(`Número actualizado a ${numeroBonito(r.numero)}. Los botones de compra ya usan este número.`);
    });
  };

  return (
    <>
      <div className="ahead">
        <div>
          <h1>Número de WhatsApp</h1>
          <p>A este número llegan los pedidos de “Comprar ahora” y del carrito.</p>
        </div>
      </div>
      <div className="wagrid">
        <section className="dcard wahero" aria-label="Número actual">
          <span className="waico">
            <IconoChat />
          </span>
          <span className="hint">Número actual</span>
          <b className="wanum">{numero ? numeroBonito(numero) : "Sin configurar"}</b>
          {numero ? (
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/${numero}`} target="_blank" rel="noopener noreferrer">
              Probar enlace actual
            </a>
          ) : null}
        </section>
        <form className="dcard waform" onSubmit={guardar} noValidate>
          <h2>Cambiar número</h2>
          <div className="field">
            <label htmlFor="f-wa">Nuevo número de celular</label>
            <input
              className="inp"
              id="f-wa"
              inputMode="tel"
              placeholder="Ej. 987 654 321"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <p className="hint" style={{ margin: 0 }}>
              Celular peruano de 9 dígitos. El código +51 se agrega solo.
            </p>
            <p className="err">{error}</p>
          </div>
          <div>
            <button className="btn btn-primary" type="submit" disabled={pendiente}>
              Guardar número
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

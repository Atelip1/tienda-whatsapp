"use client";
import { useActionState } from "react";
import { iniciarSesion } from "@/backend/acciones";

export function FormularioLogin({ aviso }: { aviso?: string }) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, undefined);
  const error = estado?.error ?? aviso;
  return (
    <form className="panel" action={accion} noValidate>
      <div>
        <h1>Acceso administrativo</h1>
        <p className="hint" style={{ margin: "6px 0 0" }}>
          Ingresa con tu cuenta para gestionar el catálogo, el stock y el número de WhatsApp.
        </p>
      </div>
      <div className="field">
        <label htmlFor="lg-email">Correo electrónico</label>
        <input className="inp" id="lg-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="lg-pw">Contraseña</label>
        <input className="inp" id="lg-pw" name="password" type="password" autoComplete="current-password" required />
        <p className="err" role="alert">
          {error}
        </p>
      </div>
      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Iniciar sesión"}
      </button>
      <p className="secure">Conexión segura (HTTPS). La sesión se cierra tras 60 minutos sin actividad.</p>
    </form>
  );
}

import type { Metadata } from "next";
import { FormularioLogin } from "@/frontend/componentes/admin/FormularioLogin";
import { Logo } from "@/frontend/componentes/Logo";

export const metadata: Metadata = { title: "Acceso administrativo" };

export default async function Login({ searchParams }: { searchParams: Promise<{ expirada?: string }> }) {
  const { expirada } = await searchParams;
  return (
    <div className="login">
      <div className="login-box">
        <div className="logo" style={{ justifyContent: "center", display: "flex" }}>
          <Logo variante="login" />
        </div>
        <FormularioLogin aviso={expirada ? "Tu sesión se cerró tras 60 minutos sin actividad. Inicia sesión otra vez." : undefined} />
      </div>
      <div className="login-fotos" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lf-principal" src="/login-bebe.jpg" alt="" width={612} height={408} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lf-secundaria" src="/portada-bebe.jpg" alt="" width={940} height={788} />
      </div>
    </div>
  );
}

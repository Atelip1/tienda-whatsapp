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
    </div>
  );
}

import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="wrap" style={{ padding: "64px 20px" }}>
      <div className="empty">
        <h2>No encontramos esta página</h2>
        <p>Puede que el producto ya no esté disponible o que el enlace haya cambiado.</p>
        <Link className="btn btn-primary" href="/">
          Ir al catálogo
        </Link>
      </div>
    </main>
  );
}

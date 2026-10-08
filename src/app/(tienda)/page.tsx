import { Catalogo } from "@/frontend/componentes/Catalogo";
import { Portada } from "@/frontend/componentes/Portada";
import { categoriasPublicas, productosPublicos } from "@/backend/consultas/tienda";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [categorias, productos] = await Promise.all([categoriasPublicas(), productosPublicos()]);
  return (
    <>
      <Portada />
      <Catalogo categorias={categorias} productos={productos} />
    </>
  );
}

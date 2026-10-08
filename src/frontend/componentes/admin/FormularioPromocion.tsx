"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { guardarPromocion } from "@/backend/acciones";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { TarjetaPromocion } from "@/frontend/componentes/TarjetaPromocion";
import { estadoPromocion, fechaCorta, hoyLima, kb } from "@/compartido/formato";
import { comprimirImagen, nombreAleatorio } from "@/frontend/lib/imagenes";
import { clienteNavegador } from "@/frontend/lib/supabase-navegador";
import { BUCKET_PRODUCTOS, BUCKET_PROMOCIONES, urlPublica } from "@/compartido/supabase";
import type { Producto, Promocion } from "@/compartido/tipos";

function sumarDias(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function FormularioPromocion({
  promo,
  productos,
  idNuevo,
}: {
  promo: Promocion | null;
  productos: Pick<Producto, "id" | "code" | "name" | "images">[];
  idNuevo: string;
}) {
  const nuevo = !promo;
  const id = promo?.id ?? idNuevo;
  const hoy = hoyLima();
  const router = useRouter();
  const avisar = useAvisos();
  const input = useRef<HTMLInputElement>(null);
  const [c, setC] = useState({
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    start_date: promo?.start_date ?? hoy,
    end_date: promo?.end_date ?? sumarDias(hoy, 14),
    product_id: promo?.product_id ?? "",
    cta: promo?.cta ?? "Ver promoción",
    active: promo?.active ?? true,
  });
  const [imagen, setImagen] = useState<{ path?: string; blob?: Blob; vista: string } | null>(
    promo?.image_path ? { path: promo.image_path, vista: urlPublica(BUCKET_PROMOCIONES, promo.image_path) } : null,
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setC((v) => ({ ...v, [k]: e.target.value }));

  const prod = productos.find((p) => p.id === c.product_id);
  const vistaImagen = imagen?.vista ?? (prod?.images[0] ? urlPublica(BUCKET_PRODUCTOS, prod.images[0].path) : "");

  async function elegirImagen(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return avisar("El archivo no es una imagen. Usa JPG o PNG.", true);
    try {
      const blob = await comprimirImagen(f, 1280);
      if (imagen?.blob) URL.revokeObjectURL(imagen.vista);
      setImagen({ blob, vista: URL.createObjectURL(blob) });
      avisar(`Imagen optimizada: ${kb(f.size)} → ${kb(blob.size)}.`);
    } catch {
      avisar("No se pudo leer la imagen. Usa JPG o PNG.", true);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const E: Record<string, string> = {};
    if (!c.title.trim()) E.title = "Escribe el título de la promoción.";
    if (!c.description.trim()) E.description = "Escribe una descripción.";
    if (!c.start_date) E.start_date = "Elige la fecha de inicio.";
    if (!c.end_date) E.end_date = "Elige la fecha de fin.";
    else if (c.start_date && c.end_date < c.start_date) E.end_date = "La fecha de fin no puede ser anterior al inicio.";
    if (!c.cta.trim()) E.cta = "Escribe el texto del botón.";
    setErrores(E);
    if (Object.keys(E).length) {
      avisar(`Revisa ${Object.keys(E).length === 1 ? "el campo marcado" : "los campos marcados"}.`, true);
      document.getElementById("pf-" + Object.keys(E)[0])?.focus();
      return;
    }
    setGuardando(true);
    const sb = clienteNavegador();
    let subida: string | null = null;
    try {
      let image_path = imagen?.path ?? null;
      if (imagen?.blob) {
        subida = `${id}/${nombreAleatorio("jpg")}`;
        const { error } = await sb.storage.from(BUCKET_PROMOCIONES).upload(subida, imagen.blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw new Error("No se pudo subir la imagen: " + error.message);
        image_path = subida;
      }
      const r = await guardarPromocion({ id, nuevo, ...c, product_id: c.product_id || null, image_path });
      if (!r.ok) {
        if (subida) await sb.storage.from(BUCKET_PROMOCIONES).remove([subida]);
        setErrores(r.campos ?? {});
        return avisar(r.error, true);
      }
      const st = estadoPromocion(c);
      avisar(
        "Promoción guardada. " +
          (st === "Activa"
            ? "Ya aparece como ventana flotante en la tienda."
            : st === "Programada"
              ? `Se mostrará desde el ${fechaCorta(c.start_date)}.`
              : `No se mostrará en la tienda (${st.toLowerCase()}).`),
      );
      router.push("/admin/promociones");
      router.refresh();
    } catch (err) {
      if (subida) await sb.storage.from(BUCKET_PROMOCIONES).remove([subida]);
      avisar(err instanceof Error ? err.message : "No se pudo guardar la promoción.", true);
    } finally {
      setGuardando(false);
    }
  }

  const Campo = (k: string, label: string, control: React.ReactNode, opts: { full?: boolean; opcional?: boolean; contador?: string } = {}) => (
    <div className={"field" + (opts.full ? " full" : "")}>
      <label htmlFor={"pf-" + k}>
        {label} {opts.opcional ? <span className="opt">(opcional)</span> : null}
      </label>
      {control}
      {opts.contador ? <span className="count-hint">{opts.contador}</span> : null}
      <p className="err">{errores[k]}</p>
    </div>
  );
  const inv = (k: string) => (errores[k] ? { "aria-invalid": true as const } : {});

  return (
    <>
      <div className="ahead">
        <div>
          <h1>{nuevo ? "Nueva promoción" : "Editar promoción"}</h1>
          <p>La vista previa muestra cómo verá el cliente la ventana flotante.</p>
        </div>
      </div>
      <div className="pform">
        <form onSubmit={guardar} noValidate>
          <div className="formgrid">
            {Campo(
              "title",
              "Título",
              <input className="inp" id="pf-title" maxLength={60} value={c.title} onChange={set("title")} placeholder="Ej. 15% en toda la ropita" {...inv("title")} />,
              { full: true, contador: `${c.title.length}/60` },
            )}
            {Campo(
              "description",
              "Descripción",
              <textarea className="inp" id="pf-description" maxLength={160} value={c.description} onChange={set("description")} placeholder="Qué incluye la promoción y cómo aprovecharla" {...inv("description")} />,
              { full: true, contador: `${c.description.length}/160` },
            )}
            {Campo("start_date", "Fecha de inicio", <input className="inp" id="pf-start_date" type="date" value={c.start_date} onChange={set("start_date")} {...inv("start_date")} />)}
            {Campo("end_date", "Fecha de fin", <input className="inp" id="pf-end_date" type="date" value={c.end_date} min={c.start_date} onChange={set("end_date")} {...inv("end_date")} />)}
            {Campo(
              "product_id",
              "Producto vinculado",
              <select className="inp" id="pf-product_id" value={c.product_id} onChange={set("product_id")}>
                <option value="">Ninguno (lleva al catálogo)</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} | {p.name}
                  </option>
                ))}
              </select>,
              { opcional: true },
            )}
            {Campo("cta", "Texto del botón", <input className="inp" id="pf-cta" maxLength={24} value={c.cta} onChange={set("cta")} {...inv("cta")} />)}
            <div className="field full">
              <label>
                Imagen de la promoción <span className="opt">(opcional)</span>
              </label>
              <div className="pimg">
                {imagen ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagen.vista} alt="Imagen de la promoción" />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>
                      Reemplazar
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImagen(null)}>
                      Quitar imagen
                    </button>
                  </>
                ) : (
                  <button type="button" className="drop wide" style={{ maxWidth: 320, minHeight: 80 }} onClick={() => input.current?.click()}>
                    Subir imagen
                    <small>Horizontal (16:9), JPG o PNG</small>
                  </button>
                )}
              </div>
              <input ref={input} type="file" accept="image/*" className="sr" onChange={(e) => (elegirImagen(e.target.files?.[0]), (e.target.value = ""))} />
              <p className="hint" style={{ margin: 0 }}>
                Si no subes una imagen, se usa la foto del producto vinculado.
              </p>
            </div>
            <div className="field full">
              <label className="switch">
                <input type="checkbox" checked={c.active} onChange={(e) => setC((v) => ({ ...v, active: e.target.checked }))} /> Mostrar en la tienda durante la vigencia
              </label>
            </div>
          </div>
          <div className="formact">
            <button className="btn btn-primary" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar promoción"}
            </button>
            <Link className="btn btn-ghost" href="/admin/promociones">
              Cancelar
            </Link>
          </div>
        </form>
        <div className="pv-wrap">
          <b>Vista previa en la tienda</b>
          <div className="pv-frame">
            <TarjetaPromocion d={{ ...c, imagen: vistaImagen }} boton={<span className="btn btn-wa">{c.cta || "Ver promoción"}</span>} />
          </div>
        </div>
      </div>
    </>
  );
}

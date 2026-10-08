"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { codigoLibre, eliminarProducto, guardarProducto } from "@/backend/acciones";
import { useAvisos } from "@/frontend/componentes/Avisos";
import { Modal } from "@/frontend/componentes/Modal";
import { MAX_VIDEO_MB } from "@/compartido/config/tienda";
import { kb } from "@/compartido/formato";
import { comprimirImagen, duracionVideo, nombreAleatorio } from "@/frontend/lib/imagenes";
import { clienteNavegador } from "@/frontend/lib/supabase-navegador";
import { BUCKET_PRODUCTOS, urlPublica } from "@/compartido/supabase";
import type { Categoria, EstadoProducto, Producto } from "@/compartido/tipos";

type Img = { clave: string; path?: string; blob?: Blob; vista: string };
type Vid = { path?: string; file?: File; nombre: string; peso: number; duracion?: number; vista: string };

const VIDEO_TIPOS = ["video/mp4", "video/webm", "video/quicktime"];

function mmss(s?: number) {
  if (!s) return "";
  const r = Math.round(s);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
}

export function FormularioProducto({
  producto,
  categorias,
  idNuevo,
}: {
  producto: Producto | null;
  categorias: Categoria[];
  idNuevo: string;
}) {
  const nuevo = !producto;
  const id = producto?.id ?? idNuevo;
  const router = useRouter();
  const avisar = useAvisos();
  const [campos, setCampos] = useState({
    code: producto?.code ?? "",
    name: producto?.name ?? "",
    category_id: producto?.category_id ?? categorias[0]?.id ?? "",
    status: (producto?.status ?? "disponible") as EstadoProducto,
    price: producto ? String(producto.price) : "",
    promo_price: producto?.promo_price != null ? String(producto.promo_price) : "",
    stock: producto ? String(producto.stock) : "",
    description: producto?.description ?? "",
  });
  const [imgs, setImgs] = useState<Img[]>(
    (producto?.images ?? []).map((i) => ({ clave: i.path, path: i.path, vista: urlPublica(BUCKET_PRODUCTOS, i.path) })),
  );
  const [video, setVideo] = useState<Vid | null>(
    producto?.video_path
      ? {
          path: producto.video_path,
          nombre: producto.video_name ?? "video",
          peso: producto.video_size ?? 0,
          vista: urlPublica(BUCKET_PRODUCTOS, producto.video_path),
        }
      : null,
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState("");
  const [borrar, setBorrar] = useState(false);
  const inputImg = useRef<HTMLInputElement>(null);
  const inputVid = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      imgs.forEach((i) => i.blob && URL.revokeObjectURL(i.vista));
      if (video?.file) URL.revokeObjectURL(video.vista);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const set = (k: keyof typeof campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }));

  async function agregarImagenes(files: FileList | null) {
    if (!files?.length) return;
    const lugar = 4 - imgs.length;
    const lista = Array.from(files).slice(0, lugar);
    if (files.length > lugar) avisar(`Máximo 4 imágenes. Se agregarán ${lugar}.`, true);
    for (const f of lista) {
      if (!f.type.startsWith("image/")) {
        avisar(`${f.name} no es una imagen.`, true);
        continue;
      }
      try {
        const blob = await comprimirImagen(f);
        setImgs((l) => [...l, { clave: nombreAleatorio("jpg"), blob, vista: URL.createObjectURL(blob) }]);
        avisar(`Imagen optimizada: ${kb(f.size)} → ${kb(blob.size)}.`);
      } catch {
        avisar(`No se pudo leer ${f.name}. Usa JPG o PNG.`, true);
      }
    }
    setErrores((e) => ({ ...e, images: "" }));
  }

  async function elegirVideo(f: File | undefined) {
    if (!f) return;
    if (!VIDEO_TIPOS.includes(f.type)) return setErrores((e) => ({ ...e, video: "El archivo no es un video. Usa MP4, WebM o MOV." }));
    if (f.size > MAX_VIDEO_MB * 1048576)
      return setErrores((e) => ({ ...e, video: `El video pesa ${kb(f.size)}. El máximo es ${MAX_VIDEO_MB} MB.` }));
    if (video?.file) URL.revokeObjectURL(video.vista);
    setVideo({ file: f, nombre: f.name, peso: f.size, duracion: await duracionVideo(f), vista: URL.createObjectURL(f) });
    setErrores((e) => ({ ...e, video: "" }));
  }

  function validar(): Record<string, string> {
    const E: Record<string, string> = {};
    const code = campos.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,20}$/.test(code)) E.code = code ? "Usa de 2 a 20 letras, números o guiones (ej. ROP-003)." : "Ingresa un código.";
    if (campos.name.trim().length < 2) E.name = "Ingresa el nombre del producto.";
    if (!campos.category_id) E.category_id = "Elige una categoría.";
    const precio = Number(campos.price);
    if (!campos.price || !(precio > 0)) E.price = "Ingresa un precio mayor que 0.";
    if (campos.promo_price !== "") {
      const pp = Number(campos.promo_price);
      if (!(pp > 0) || (precio > 0 && pp >= precio)) E.promo_price = "Debe ser mayor que 0 y menor que el precio regular.";
    }
    const st = Number(campos.stock);
    if (campos.stock === "" || !Number.isInteger(st) || st < 0) E.stock = "Ingresa un número entero de 0 o más.";
    if (!campos.description.trim()) E.description = "Agrega una descripción.";
    if (imgs.length < 3 || imgs.length > 4) E.images = `Agrega entre 3 y 4 imágenes (tienes ${imgs.length}).`;
    return E;
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const E = validar();
    setErrores(E);
    if (Object.keys(E).length) {
      avisar(`Revisa ${Object.keys(E).length === 1 ? "el campo marcado" : `los ${Object.keys(E).length} campos marcados`}.`, true);
      document.getElementById("f-" + Object.keys(E)[0])?.focus();
      return;
    }
    setGuardando(true);
    const subidos: string[] = [];
    const sb = clienteNavegador();
    try {
      setPaso("Revisando el código…");
      if (!(await codigoLibre(campos.code, id))) {
        setErrores({ code: `Ya existe un producto con el código ${campos.code.trim().toUpperCase()}. Usa otro.` });
        avisar("Revisa el campo marcado.", true);
        return;
      }
      const rutas: string[] = [];
      for (const [k, i] of imgs.entries()) {
        if (i.path) {
          rutas.push(i.path);
          continue;
        }
        setPaso(`Subiendo imagen ${k + 1} de ${imgs.length}…`);
        const ruta = `${id}/${i.clave}`;
        const { error } = await sb.storage.from(BUCKET_PRODUCTOS).upload(ruta, i.blob!, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw new Error("No se pudo subir una imagen: " + error.message);
        subidos.push(ruta);
        rutas.push(ruta);
      }
      let datosVideo: { path: string; name: string; size: number } | null = null;
      if (video?.file) {
        setPaso("Subiendo el video… puede tardar unos minutos.");
        const ext = (video.file.name.split(".").pop() || "mp4").toLowerCase();
        const ruta = `${id}/video-${nombreAleatorio(ext)}`;
        const { error } = await sb.storage.from(BUCKET_PRODUCTOS).upload(ruta, video.file, { contentType: video.file.type, cacheControl: "31536000" });
        if (error) throw new Error("No se pudo subir el video: " + error.message);
        subidos.push(ruta);
        datosVideo = { path: ruta, name: video.nombre, size: video.peso };
      } else if (video?.path) {
        datosVideo = { path: video.path, name: video.nombre, size: video.peso };
      }
      setPaso("Guardando…");
      const r = await guardarProducto({
        id,
        nuevo,
        code: campos.code,
        name: campos.name,
        category_id: campos.category_id,
        status: campos.status,
        price: Number(campos.price),
        promo_price: campos.promo_price === "" ? null : Number(campos.promo_price),
        stock: Number(campos.stock),
        description: campos.description,
        images: rutas,
        video: datosVideo,
      });
      if (!r.ok) {
        if (subidos.length) await sb.storage.from(BUCKET_PRODUCTOS).remove(subidos);
        setErrores(r.campos ?? {});
        avisar(r.error, true);
        return;
      }
      avisar(
        "Producto guardado. Ya se ve en la tienda." +
          (Number(campos.stock) === 0 && campos.status === "disponible" ? " Como el stock es 0, quedó como Agotado." : ""),
      );
      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      if (subidos.length) await sb.storage.from(BUCKET_PRODUCTOS).remove(subidos);
      avisar(err instanceof Error ? err.message : "No se pudo guardar el producto.", true);
    } finally {
      setGuardando(false);
      setPaso("");
    }
  }

  async function confirmarBorrado() {
    setBorrar(false);
    const r = await eliminarProducto(id);
    if (!r.ok) return avisar(r.error, true);
    avisar("Producto eliminado.");
    router.push("/admin/productos");
    router.refresh();
  }

  const Campo = ({ k, label, opcional, children, full }: { k: string; label: string; opcional?: boolean; children: React.ReactNode; full?: boolean }) => (
    <div className={"field" + (full ? " full" : "")}>
      <label htmlFor={"f-" + k}>
        {label} {opcional ? <span className="opt">(opcional)</span> : null}
      </label>
      {children}
      <p className="err" id={"e-" + k}>
        {errores[k]}
      </p>
    </div>
  );
  const inv = (k: string) => ({ "aria-invalid": errores[k] ? true : undefined, "aria-describedby": "e-" + k });

  return (
    <>
      <div className="ahead">
        <div>
          <h1>{nuevo ? "Nuevo producto" : "Editar producto"}</h1>
          <p>Los campos sin “opcional” son obligatorios.</p>
        </div>
        {!nuevo ? (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setBorrar(true)}>
            Eliminar producto
          </button>
        ) : null}
      </div>
      <form onSubmit={guardar} noValidate>
        <div className="formgrid">
          {Campo({
            k: "code",
            label: "Código",
            children: (
              <input className="inp" id="f-code" value={campos.code} onChange={set("code")} placeholder="Ej. ROP-003" style={{ textTransform: "uppercase" }} maxLength={20} {...inv("code")} />
            ),
          })}
          {Campo({ k: "name", label: "Nombre", children: <input className="inp" id="f-name" value={campos.name} onChange={set("name")} maxLength={120} {...inv("name")} /> })}
          {Campo({
            k: "category_id",
            label: "Categoría",
            children: (
              <select className="inp" id="f-category_id" value={campos.category_id} onChange={set("category_id")} {...inv("category_id")}>
                {categorias.length === 0 ? <option value="">Primero crea una categoría</option> : null}
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.visible ? "" : " (oculta)"}
                  </option>
                ))}
              </select>
            ),
          })}
          {Campo({
            k: "status",
            label: "Estado",
            children: (
              <select className="inp" id="f-status" value={campos.status} onChange={set("status")}>
                <option value="disponible">Disponible</option>
                <option value="agotado">Agotado</option>
                <option value="oculto">Oculto</option>
              </select>
            ),
          })}
          {Campo({
            k: "price",
            label: "Precio regular (S/)",
            children: <input className="inp" id="f-price" type="number" min={0} step="0.10" inputMode="decimal" value={campos.price} onChange={set("price")} {...inv("price")} />,
          })}
          {Campo({
            k: "promo_price",
            label: "Precio promocional (S/)",
            opcional: true,
            children: (
              <input className="inp" id="f-promo_price" type="number" min={0} step="0.10" inputMode="decimal" value={campos.promo_price} onChange={set("promo_price")} {...inv("promo_price")} />
            ),
          })}
          {Campo({
            k: "stock",
            label: "Stock",
            children: <input className="inp" id="f-stock" type="number" min={0} step={1} inputMode="numeric" value={campos.stock} onChange={set("stock")} {...inv("stock")} />,
          })}
          <div className="field" />
          {Campo({
            k: "description",
            label: "Descripción",
            full: true,
            children: <textarea className="inp" id="f-description" value={campos.description} onChange={set("description")} maxLength={2000} {...inv("description")} />,
          })}

          <div className="field full">
            <label>Imágenes (3 a 4)</label>
            <div className="imgs">
              {imgs.map((i, k) => (
                <figure key={i.clave}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.vista} alt={`Imagen ${k + 1}${k === 0 ? " (principal)" : ""}`} />
                  <button type="button" aria-label={`Quitar imagen ${k + 1}`} onClick={() => setImgs((l) => l.filter((x) => x.clave !== i.clave))}>
                    ×
                  </button>
                  {k > 0 ? (
                    <button
                      type="button"
                      className="mkmain"
                      onClick={() => setImgs((l) => [i, ...l.filter((x) => x.clave !== i.clave)])}
                      aria-label={`Usar la imagen ${k + 1} como principal`}
                    >
                      Principal
                    </button>
                  ) : (
                    <span className="ismain">Principal</span>
                  )}
                </figure>
              ))}
              {imgs.length < 4 ? (
                <button type="button" className="drop" onClick={() => inputImg.current?.click()}>
                  Subir imagen
                </button>
              ) : null}
            </div>
            <input ref={inputImg} type="file" accept="image/*" multiple className="sr" onChange={(e) => (agregarImagenes(e.target.files), (e.target.value = ""))} />
            <p className="hint" style={{ margin: 0 }}>
              Las fotos se comprimen y redimensionan automáticamente al subirlas. La primera es la imagen principal.
            </p>
            <p className="err" id="e-images">
              {errores.images}
            </p>
          </div>

          <div className="field full">
            <label>
              Video del producto <span className="opt">(opcional)</span>
            </label>
            {video ? (
              <div className="vcard">
                <div className="vplayer">
                  <video src={video.vista} controls playsInline preload="metadata" />
                </div>
                <div className="vinfo">
                  <span className="vstate">{video.file ? "Listo para subir" : "Video guardado"}</span>
                  <b>{video.nombre}</b>
                  <div className="vmeta">
                    {video.peso ? <span>{kb(video.peso)}</span> : null}
                    {video.duracion ? <span>{mmss(video.duracion)} min</span> : null}
                  </div>
                  <span className="hint">Se mostrará en la galería del producto, después de las fotos.</span>
                  <div className="btns">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputVid.current?.click()}>
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (video.file) URL.revokeObjectURL(video.vista);
                        setVideo(null);
                      }}
                    >
                      Quitar video
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" className="drop wide" onClick={() => inputVid.current?.click()}>
                Subir video
                <small>
                  Desde el celular o la computadora. MP4, WebM o MOV, hasta {MAX_VIDEO_MB} MB. Recomendado: de 10 a 60 segundos.
                </small>
              </button>
            )}
            <input ref={inputVid} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr" onChange={(e) => (elegirVideo(e.target.files?.[0]), (e.target.value = ""))} />
            <p className="err" id="e-video">
              {errores.video}
            </p>
          </div>
        </div>
        <div className="formact">
          <button className="btn btn-primary" type="submit" disabled={guardando}>
            {guardando ? paso || "Guardando…" : "Guardar producto"}
          </button>
          <Link className="btn btn-ghost" href="/admin/productos">
            Cancelar
          </Link>
        </div>
      </form>
      <Modal abierto={borrar} alCerrar={() => setBorrar(false)} className="mpad" etiqueta="Eliminar producto">
        <h2>¿Eliminar el producto?</h2>
        <p className="hint">
          “{campos.name}” dejará de verse en la tienda y se borrarán sus fotos y su video. Si solo quieres dejar de mostrarlo, cambia su estado a
          Oculto.
        </p>
        <div className="mbtns">
          <button className="btn btn-danger" onClick={confirmarBorrado}>
            Eliminar producto
          </button>
          <button className="btn btn-ghost" data-autofocus onClick={() => setBorrar(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
}

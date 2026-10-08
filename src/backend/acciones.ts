"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESION_MINUTOS } from "@/compartido/config/tienda";
import { clienteServidor } from "@/backend/supabase/servidor";
import { BUCKET_PRODUCTOS, BUCKET_PROMOCIONES } from "@/compartido/supabase";

const COOKIE_ACTIVIDAD = "panel_actividad";

export type Resultado<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; campos?: Record<string, string> };

async function marcarActividad() {
  (await cookies()).set(COOKIE_ACTIVIDAD, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESION_MINUTOS * 60,
    path: "/",
  });
}

/** Solo la propietaria (tabla admins) puede usar estas acciones. RLS lo vuelve a comprobar en la base. */
async function propietaria() {
  const sb = await clienteServidor();
  const { data: sesion } = await sb.auth.getClaims();
  const id = sesion?.claims?.sub;
  if (!id) throw new Error("SIN_SESION");
  const { data } = await sb.from("admins").select("user_id").eq("user_id", id).maybeSingle();
  if (!data) throw new Error("SIN_PERMISO");
  return sb;
}

function publicar() {
  revalidatePath("/", "layout");
}

function errorDe(e: unknown): { ok: false; error: string } {
  const m = e instanceof Error ? e.message : String(e);
  if (m === "SIN_SESION") return { ok: false, error: "Tu sesión se cerró. Inicia sesión otra vez." };
  if (m === "SIN_PERMISO") return { ok: false, error: "Tu cuenta no tiene permiso para usar el panel." };
  console.error(e);
  return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo otra vez." };
}

function camposDe(err: z.ZodError): Record<string, string> {
  const c: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "general");
    if (!c[k]) c[k] = i.message;
  }
  return c;
}

/* ------------------------------ Sesión ------------------------------ */

export async function iniciarSesion(_prev: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y tu contraseña." };
  const sb = await clienteServidor();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Correo o contraseña incorrectos." };
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await sb.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
  }
  await marcarActividad();
  redirect("/admin/inicio");
}

export async function cerrarSesion() {
  const sb = await clienteServidor();
  await sb.auth.signOut();
  (await cookies()).delete(COOKIE_ACTIVIDAD);
  redirect("/admin/login");
}

/** RNF-06: el panel avisa que hay actividad (escribir, hacer clic) aunque no se cambie de página. */
export async function mantenerSesion(): Promise<boolean> {
  const sb = await clienteServidor();
  const { data: sesion } = await sb.auth.getClaims();
  const actual = (await cookies()).get(COOKIE_ACTIVIDAD)?.value;
  if (!sesion?.claims?.sub || !actual || Date.now() - Number(actual) > SESION_MINUTOS * 60_000) return false;
  await marcarActividad();
  return true;
}

/* ----------------------------- Productos ---------------------------- */

const esquemaProducto = z
  .object({
    id: z.uuid(),
    nuevo: z.boolean(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{2,20}$/, "Usa de 2 a 20 letras, números o guiones (ej. ROP-003)."),
    name: z.string().trim().min(2, "Ingresa el nombre del producto.").max(120, "Máximo 120 caracteres."),
    category_id: z.uuid("Elige una categoría."),
    status: z.enum(["disponible", "agotado", "oculto"]),
    price: z.number("Ingresa un precio mayor que 0.").positive("Ingresa un precio mayor que 0.").max(99999),
    promo_price: z.number().positive().nullable(),
    stock: z.number("Ingresa un número entero de 0 o más.").int("Ingresa un número entero de 0 o más.").min(0, "Ingresa un número entero de 0 o más."),
    description: z.string().trim().min(1, "Agrega una descripción.").max(2000, "Máximo 2000 caracteres."),
    images: z.array(z.string().min(1)).min(3, "Agrega entre 3 y 4 imágenes.").max(4, "Agrega entre 3 y 4 imágenes."),
    video: z.object({ path: z.string().min(1), name: z.string(), size: z.number() }).nullable(),
  })
  .refine((d) => d.promo_price == null || d.promo_price < d.price, {
    path: ["promo_price"],
    message: "Debe ser mayor que 0 y menor que el precio regular.",
  });

export type DatosProducto = z.input<typeof esquemaProducto>;

export async function codigoLibre(code: string, id: string): Promise<boolean> {
  const sb = await propietaria();
  const { data } = await sb.from("products").select("id").eq("code", code.trim().toUpperCase()).neq("id", id).maybeSingle();
  return !data;
}

export async function guardarProducto(entrada: DatosProducto): Promise<Resultado<{ estado: string }>> {
  const v = esquemaProducto.safeParse(entrada);
  if (!v.success) return { ok: false, error: "Revisa los campos marcados.", campos: camposDe(v.error) };
  const d = v.data;
  try {
    const sb = await propietaria();
    let anteriores: string[] = [];
    let videoAnterior: string | null = null;
    if (!d.nuevo) {
      const { data: prev } = await sb.from("products").select("video_path, images:product_images(path)").eq("id", d.id).maybeSingle();
      if (!prev) return { ok: false, error: "No encontramos el producto. Puede que se haya eliminado." };
      anteriores = (prev.images ?? []).map((i: { path: string }) => i.path);
      videoAnterior = prev.video_path;
    }
    const fila = {
      id: d.id,
      code: d.code,
      name: d.name,
      category_id: d.category_id,
      status: d.status,
      price: Math.round(d.price * 100) / 100,
      promo_price: d.promo_price == null ? null : Math.round(d.promo_price * 100) / 100,
      stock: d.stock,
      description: d.description,
      video_path: d.video?.path ?? null,
      video_name: d.video?.name ?? null,
      video_size: d.video?.size ?? null,
    };
    const { data: guardado, error } = d.nuevo
      ? await sb.from("products").insert(fila).select("status").single()
      : await sb.from("products").update(fila).eq("id", d.id).select("status").single();
    if (error) {
      if (error.code === "23505")
        return { ok: false, error: "Revisa los campos marcados.", campos: { code: `Ya existe un producto con el código ${d.code}. Usa otro.` } };
      throw error;
    }
    await sb.from("product_images").delete().eq("product_id", d.id);
    const { error: eImg } = await sb
      .from("product_images")
      .insert(d.images.map((path, position) => ({ product_id: d.id, path, position })));
    if (eImg) throw eImg;

    const sobrantes = anteriores.filter((p) => !d.images.includes(p));
    if (videoAnterior && videoAnterior !== d.video?.path) sobrantes.push(videoAnterior);
    if (sobrantes.length) await sb.storage.from(BUCKET_PRODUCTOS).remove(sobrantes);

    publicar();
    return { ok: true, estado: guardado.status };
  } catch (e) {
    return errorDe(e);
  }
}

/** RF-18 / RF-19: stock 0 => Agotado; al reponer un agotado, vuelve a Disponible. */
export async function actualizarStock(id: string, stock: number): Promise<Resultado<{ estado: string }>> {
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, error: "El stock debe ser un número entero de 0 o más." };
  try {
    const sb = await propietaria();
    const { data: prev } = await sb.from("products").select("stock, status").eq("id", id).single();
    const cambios: { stock: number; status?: string } = { stock };
    if (prev && prev.status === "agotado" && prev.stock === 0 && stock > 0) cambios.status = "disponible";
    const { data, error } = await sb.from("products").update(cambios).eq("id", id).select("status").single();
    if (error) throw error;
    publicar();
    return { ok: true, estado: data.status };
  } catch (e) {
    return errorDe(e);
  }
}

/** RF-17 */
export async function actualizarEstado(id: string, estado: string): Promise<Resultado> {
  if (!["disponible", "agotado", "oculto"].includes(estado)) return { ok: false, error: "Estado no válido." };
  try {
    const sb = await propietaria();
    if (estado === "disponible") {
      const { data } = await sb.from("products").select("stock").eq("id", id).single();
      if (data && data.stock === 0) return { ok: false, error: "Para marcarlo como disponible, primero actualiza el stock." };
    }
    const { error } = await sb.from("products").update({ status: estado }).eq("id", id);
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorDe(e);
  }
}

export async function eliminarProducto(id: string): Promise<Resultado> {
  try {
    const sb = await propietaria();
    const { data: prev } = await sb.from("products").select("video_path, images:product_images(path)").eq("id", id).maybeSingle();
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) throw error;
    const archivos = [...(prev?.images ?? []).map((i: { path: string }) => i.path), ...(prev?.video_path ? [prev.video_path] : [])];
    if (archivos.length) await sb.storage.from(BUCKET_PRODUCTOS).remove(archivos);
    publicar();
    return { ok: true };
  } catch (e) {
    return errorDe(e);
  }
}

/* ---------------------------- Categorías ---------------------------- */

const nombreCategoria = z.string().trim().min(1, "Escribe el nombre de la categoría.").max(60, "Máximo 60 caracteres.");

function errorCategoria(e: unknown): { ok: false; error: string } {
  const code = (e as { code?: string })?.code;
  if (code === "23505") return { ok: false, error: "Ya existe una categoría con ese nombre." };
  if (code === "23503") return { ok: false, error: "No se puede eliminar: la categoría tiene productos. Muévelos u ocúltala." };
  return errorDe(e);
}

export async function crearCategoria(nombre: string): Promise<Resultado> {
  const v = nombreCategoria.safeParse(nombre);
  if (!v.success) return { ok: false, error: v.error.issues[0].message };
  try {
    const sb = await propietaria();
    const { data: ult } = await sb.from("categories").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
    const { error } = await sb.from("categories").insert({ name: v.data, sort: (ult?.sort ?? 0) + 1 });
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorCategoria(e);
  }
}

export async function renombrarCategoria(id: string, nombre: string): Promise<Resultado> {
  const v = nombreCategoria.safeParse(nombre);
  if (!v.success) return { ok: false, error: v.error.issues[0].message };
  try {
    const sb = await propietaria();
    const { error } = await sb.from("categories").update({ name: v.data }).eq("id", id);
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorCategoria(e);
  }
}

export async function visibilidadCategoria(id: string, visible: boolean): Promise<Resultado> {
  try {
    const sb = await propietaria();
    const { error } = await sb.from("categories").update({ visible }).eq("id", id);
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorCategoria(e);
  }
}

export async function eliminarCategoria(id: string): Promise<Resultado> {
  try {
    const sb = await propietaria();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorCategoria(e);
  }
}

/* ----------------------------- WhatsApp ----------------------------- */

/** RF-20 / RN-09 */
export async function guardarWhatsApp(entrada: string): Promise<Resultado<{ numero: string }>> {
  let n = entrada.replace(/[\s\-+()]/g, "");
  if (/^9\d{8}$/.test(n)) n = "51" + n;
  if (!/^519\d{8}$/.test(n)) return { ok: false, error: "Ingresa un celular peruano de 9 dígitos que empiece con 9." };
  try {
    const sb = await propietaria();
    const { error } = await sb.from("settings").update({ whatsapp: n, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw error;
    publicar();
    return { ok: true, numero: n };
  } catch (e) {
    return errorDe(e);
  }
}

/* ---------------------------- Promociones --------------------------- */

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha.");
const esquemaPromo = z
  .object({
    id: z.uuid(),
    nuevo: z.boolean(),
    title: z.string().trim().min(1, "Escribe el título de la promoción.").max(60, "Máximo 60 caracteres."),
    description: z.string().trim().min(1, "Escribe una descripción.").max(160, "Máximo 160 caracteres."),
    start_date: fecha,
    end_date: fecha,
    product_id: z.uuid().nullable(),
    cta: z.string().trim().min(1, "Escribe el texto del botón.").max(24, "Máximo 24 caracteres."),
    image_path: z.string().nullable(),
    active: z.boolean(),
  })
  .refine((d) => d.end_date >= d.start_date, { path: ["end_date"], message: "La fecha de fin no puede ser anterior al inicio." });

export type DatosPromocion = z.input<typeof esquemaPromo>;

export async function guardarPromocion(entrada: DatosPromocion): Promise<Resultado> {
  const v = esquemaPromo.safeParse(entrada);
  if (!v.success) return { ok: false, error: "Revisa los campos marcados.", campos: camposDe(v.error) };
  const { nuevo, ...d } = v.data;
  try {
    const sb = await propietaria();
    let imagenAnterior: string | null = null;
    if (!nuevo) {
      const { data } = await sb.from("promotions").select("image_path").eq("id", d.id).maybeSingle();
      if (!data) return { ok: false, error: "No encontramos la promoción." };
      imagenAnterior = data.image_path;
    }
    const { error } = nuevo ? await sb.from("promotions").insert(d) : await sb.from("promotions").update(d).eq("id", d.id);
    if (error) throw error;
    if (imagenAnterior && imagenAnterior !== d.image_path) await sb.storage.from(BUCKET_PROMOCIONES).remove([imagenAnterior]);
    publicar();
    return { ok: true };
  } catch (e) {
    return errorDe(e);
  }
}

export async function activarPromocion(id: string, active: boolean): Promise<Resultado> {
  try {
    const sb = await propietaria();
    const { error } = await sb.from("promotions").update({ active }).eq("id", id);
    if (error) throw error;
    publicar();
    return { ok: true };
  } catch (e) {
    return errorDe(e);
  }
}

export async function eliminarPromocion(id: string): Promise<Resultado> {
  try {
    const sb = await propietaria();
    const { data } = await sb.from("promotions").select("image_path").eq("id", id).maybeSingle();
    const { error } = await sb.from("promotions").delete().eq("id", id);
    if (error) throw error;
    if (data?.image_path) await sb.storage.from(BUCKET_PROMOCIONES).remove([data.image_path]);
    publicar();
    return { ok: true };
  } catch (e) {
    return errorDe(e);
  }
}

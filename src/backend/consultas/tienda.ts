import "server-only";
import { clientePublico } from "@/backend/supabase/publico";
import type { Categoria, Producto, Promocion } from "@/compartido/tipos";

export const SELECT_PRODUCTO =
  "id, code, name, description, price, promo_price, stock, status, category_id, video_path, video_name, video_size, images:product_images(id, path, position), category:categories(id, name, visible)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizarProducto(r: any): Producto {
  return {
    ...r,
    price: Number(r.price),
    promo_price: r.promo_price == null ? null : Number(r.promo_price),
    stock: Number(r.stock),
    images: [...(r.images ?? [])].sort((a, b) => a.position - b.position),
  };
}

/** RF-02 / RF-14: solo categorías visibles (las reglas RLS ya lo garantizan). */
export async function categoriasPublicas(): Promise<Categoria[]> {
  const sb = clientePublico();
  if (!sb) return [];
  const { data, error } = await sb.from("categories").select("id, name, visible, sort").order("sort").order("name");
  if (error) {
    console.error("categorias", error.message);
    return [];
  }
  return data ?? [];
}

/** RF-01: catálogo publicado. Los productos ocultos o de categorías ocultas no llegan (RLS). */
export async function productosPublicos(categoriaId?: string): Promise<Producto[]> {
  const sb = clientePublico();
  if (!sb) return [];
  let q = sb.from("products").select(SELECT_PRODUCTO).order("created_at", { ascending: false });
  if (categoriaId) q = q.eq("category_id", categoriaId);
  const { data, error } = await q;
  if (error) {
    console.error("productos", error.message);
    return [];
  }
  return (data ?? []).map(normalizarProducto);
}

export async function productoPublico(id: string): Promise<Producto | null> {
  const sb = clientePublico();
  if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await sb.from("products").select(SELECT_PRODUCTO).eq("id", id).maybeSingle();
  if (error) {
    console.error("producto", error.message);
    return null;
  }
  return data ? normalizarProducto(data) : null;
}

export async function numeroWhatsApp(): Promise<string> {
  const sb = clientePublico();
  if (!sb) return "";
  const { data } = await sb.from("settings").select("whatsapp").eq("id", 1).maybeSingle();
  return data?.whatsapp ?? "";
}

/** Promociones activas y vigentes hoy (la regla RLS filtra por fecha en hora de Lima). */
export async function promocionesActivas(): Promise<Promocion[]> {
  const sb = clientePublico();
  if (!sb) return [];
  const { data, error } = await sb
    .from("promotions")
    .select(
      "id, title, description, start_date, end_date, product_id, cta, image_path, active, created_at, product:products(id, name, images:product_images(id, path, position))",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("promociones", error.message);
    return [];
  }
  return (data ?? []) as unknown as Promocion[];
}

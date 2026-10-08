import "server-only";
import { clienteServidor } from "@/backend/supabase/servidor";
import { normalizarProducto, SELECT_PRODUCTO } from "./tienda";
import type { Categoria, Producto, Promocion } from "@/compartido/tipos";

export async function todasLasCategorias(): Promise<(Categoria & { productos: number })[]> {
  const sb = await clienteServidor();
  const { data } = await sb.from("categories").select("id, name, visible, sort, products(count)").order("sort").order("name");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((c: any) => ({ ...c, productos: c.products?.[0]?.count ?? 0 }));
}

export async function todosLosProductos(): Promise<Producto[]> {
  const sb = await clienteServidor();
  const { data } = await sb.from("products").select(SELECT_PRODUCTO).order("created_at", { ascending: false });
  return (data ?? []).map(normalizarProducto);
}

export async function productoPanel(id: string): Promise<Producto | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = await clienteServidor();
  const { data } = await sb.from("products").select(SELECT_PRODUCTO).eq("id", id).maybeSingle();
  return data ? normalizarProducto(data) : null;
}

export async function todasLasPromociones(): Promise<Promocion[]> {
  const sb = await clienteServidor();
  const { data } = await sb
    .from("promotions")
    .select(
      "id, title, description, start_date, end_date, product_id, cta, image_path, active, created_at, product:products(id, name, images:product_images(id, path, position))",
    )
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Promocion[];
}

export async function whatsappPanel(): Promise<string> {
  const sb = await clienteServidor();
  const { data } = await sb.from("settings").select("whatsapp").eq("id", 1).maybeSingle();
  return data?.whatsapp ?? "";
}

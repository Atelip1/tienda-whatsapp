export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const BUCKET_PRODUCTOS = "productos";
export const BUCKET_PROMOCIONES = "promociones";

/** URL pública de un archivo guardado en Supabase Storage. */
export function urlPublica(bucket: string, path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

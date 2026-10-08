export type EstadoProducto = "disponible" | "agotado" | "oculto";

export interface Categoria {
  id: string;
  name: string;
  visible: boolean;
  sort: number;
}

export interface ImagenProducto {
  id: string;
  path: string;
  position: number;
}

export interface Producto {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  promo_price: number | null;
  stock: number;
  status: EstadoProducto;
  category_id: string;
  video_path: string | null;
  video_name: string | null;
  video_size: number | null;
  images: ImagenProducto[];
  category?: { id: string; name: string; visible: boolean } | null;
}

export interface Promocion {
  id: string;
  title: string;
  description: string;
  start_date: string; // AAAA-MM-DD
  end_date: string;
  product_id: string | null;
  cta: string;
  image_path: string | null;
  active: boolean;
  created_at: string;
  product?: { id: string; name: string; images: ImagenProducto[] } | null;
}

export interface LineaCarrito {
  id: string;
  qty: number;
}

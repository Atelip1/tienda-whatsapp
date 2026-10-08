"use client";

/** RNF-04: redimensiona (máx. 1200 px) y comprime a JPEG antes de subir. */
export async function comprimirImagen(file: File, maxLado = 1200, calidad = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("No se pudo leer la imagen."));
      i.src = url;
    });
    const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * escala);
    c.height = Math.round(img.naturalHeight * escala);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, mal) =>
      c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo comprimir la imagen."))), "image/jpeg", calidad),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function duracionVideo(file: File): Promise<number> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      ok(Number.isFinite(v.duration) ? v.duration : 0);
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      ok(0);
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

export function nombreAleatorio(ext: string) {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

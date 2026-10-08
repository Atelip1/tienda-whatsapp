"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUCKET_PRODUCTOS, BUCKET_PROMOCIONES, urlPublica } from "@/compartido/supabase";
import type { Promocion } from "@/compartido/tipos";
import { IconoRegalo } from "./Iconos";
import { Modal } from "./Modal";
import { TarjetaPromocion } from "./TarjetaPromocion";

const VISTO = "promos-vistas";

export function imagenPromo(pr: Promocion): string {
  if (pr.image_path) return urlPublica(BUCKET_PROMOCIONES, pr.image_path);
  const img = pr.product?.images?.slice().sort((a, b) => a.position - b.position)[0];
  return img ? urlPublica(BUCKET_PRODUCTOS, img.path) : "";
}

/** Ventana flotante de promociones: aparece una vez por visita; si hay varias, en carrusel. */
export function Promociones({ promos }: { promos: Promocion[] }) {
  const [abierto, setAbierto] = useState(false);
  const [i, setI] = useState(0);
  const router = useRouter();
  const x0 = useRef<number | null>(null);
  const n = promos.length;
  const firma = promos.map((p) => p.id).join(",");

  useEffect(() => {
    if (!n) return;
    let visto = "";
    try {
      visto = sessionStorage.getItem(VISTO) ?? "";
    } catch {}
    if (visto === firma) return;
    const t = setTimeout(() => {
      setAbierto(true);
      try {
        sessionStorage.setItem(VISTO, firma);
      } catch {}
    }, 900);
    return () => clearTimeout(t);
  }, [n, firma]);

  const cerrar = useCallback(() => setAbierto(false), []);
  const ir = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    if (!abierto || n < 2) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((v) => (v + 1) % n);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + n) % n);
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto, n]);

  if (!n) return null;
  const pr = promos[Math.min(i, n - 1)];
  const destino = pr.product ? `/producto/${pr.product.id}` : "/#productos";

  return (
    <>
      <button className="promo-pill" onClick={() => setAbierto(true)} aria-label={n > 1 ? `Ver ${n} promociones` : "Ver promoción"}>
        <IconoRegalo />
        {n > 1 ? (
          <>
            Promociones <span className="pcount">{n}</span>
          </>
        ) : (
          "Promoción"
        )}
      </button>
      <Modal abierto={abierto} alCerrar={cerrar} className="promo-modal" etiqueta="Promociones">
        <div
          onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (x0.current == null || n < 2) return;
            const dx = e.changedTouches[0].clientX - x0.current;
            if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1));
            x0.current = null;
          }}
        >
          <button className="mclose" onClick={cerrar} aria-label="Cerrar promociones">
            ×
          </button>
          <div aria-live="polite">
            <TarjetaPromocion
              d={{ ...pr, imagen: imagenPromo(pr) }}
              etiqueta={n > 1 ? `Promoción ${i + 1} de ${n}` : "Promoción"}
              boton={
                <button
                  className="btn btn-wa"
                  data-autofocus
                  onClick={() => {
                    cerrar();
                    router.push(destino);
                  }}
                >
                  {pr.cta}
                </button>
              }
              pie={
                <button className="promo-later" onClick={cerrar}>
                  Ahora no, gracias
                </button>
              }
            />
          </div>
          {n > 1 ? (
            <div className="promo-nav" role="group" aria-label="Cambiar promoción">
              <button className="pnav" onClick={() => ir(i - 1)} aria-label="Promoción anterior">
                ‹
              </button>
              <div className="pdots">
                {promos.map((p, k) => (
                  <button key={p.id} className="pdot" onClick={() => ir(k)} aria-label={`Ver promoción ${k + 1}`} aria-current={k === i} />
                ))}
              </div>
              <button className="pnav" onClick={() => ir(i + 1)} aria-label="Promoción siguiente">
                ›
              </button>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

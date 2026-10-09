"use client";
import { useRef, useState } from "react";
import { IconoPlay } from "./Iconos";

/**
 * RF-03: 3 a 4 imágenes y video opcional. Sin video no aparece su miniatura.
 * Flechas para pasar de una foto a otra; el video se reproduce solo, sin sonido y en bucle.
 */
export function Galeria({ imagenes, video, nombre }: { imagenes: string[]; video: string | null; nombre: string }) {
  const [i, setI] = useState(0);
  const total = imagenes.length + (video ? 1 : 0);
  const esVideo = Boolean(video) && i === imagenes.length;
  const x0 = useRef<number | null>(null);
  const ir = (k: number) => total > 0 && setI(((k % total) + total) % total);

  return (
    <div className="gallery">
      <div
        className="main"
        onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (x0.current == null) return;
          const dx = e.changedTouches[0].clientX - x0.current;
          if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1));
          x0.current = null;
        }}
      >
        {esVideo ? (
          <video
            key={video!}
            className="gvideo"
            src={video!}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={imagenes[0]}
            aria-label={`Video de ${nombre}`}
          />
        ) : imagenes[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenes[i]} alt={`${nombre}, foto ${i + 1} de ${total}`} width={800} height={800} />
        ) : null}
        {total > 1 ? (
          <>
            <button type="button" className="gnav prev" onClick={() => ir(i - 1)} aria-label="Foto anterior">
              ‹
            </button>
            <button type="button" className="gnav next" onClick={() => ir(i + 1)} aria-label="Foto siguiente">
              ›
            </button>
            <span className="gcount" aria-hidden>
              {i + 1} / {total}
            </span>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <div className="thumbs">
          {imagenes.map((src, k) => (
            <button key={src} type="button" onClick={() => setI(k)} aria-label={`Foto ${k + 1}`} aria-current={k === i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
          {video ? (
            <button
              type="button"
              className="vt"
              onClick={() => setI(imagenes.length)}
              aria-label="Ver video"
              aria-current={i === imagenes.length}
              style={{ backgroundImage: imagenes[0] ? `url("${imagenes[0]}")` : undefined }}
            >
              <span>
                <IconoPlay style={{ color: "#fff" }} />
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

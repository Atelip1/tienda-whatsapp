"use client";
import { useState } from "react";
import { IconoPlay } from "./Iconos";

/** RF-03: 3 a 4 imágenes y video opcional. Sin video no aparece su miniatura. */
export function Galeria({ imagenes, video, nombre }: { imagenes: string[]; video: string | null; nombre: string }) {
  const [i, setI] = useState(0);
  const total = imagenes.length + (video ? 1 : 0);
  const esVideo = video && i === imagenes.length;
  return (
    <div className="gallery">
      <div className="main">
        {esVideo ? (
          <div className="video" style={{ padding: 0 }}>
            <video src={video!} controls playsInline preload="metadata" poster={imagenes[0]} aria-label={`Video de ${nombre}`} />
          </div>
        ) : imagenes[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenes[i]} alt={`${nombre}, foto ${i + 1}`} width={800} height={800} />
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

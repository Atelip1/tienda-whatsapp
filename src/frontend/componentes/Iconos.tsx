type P = { className?: string; style?: React.CSSProperties };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconoCarrito = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="17" cy="20" r="1.4" />
  </svg>
);
export const IconoChat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z" />
  </svg>
);
export const IconoCorazon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
);
export const IconoEscudo = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const IconoRegalo = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v9h14v-9" />
    <path d="M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z" />
  </svg>
);
export const IconoAtras = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const IconoPlay = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M7 4.5v15l12.5-7.5z" />
  </svg>
);
export const IconoInicio = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
export const IconoCaja = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 7l9-4 9 4-9 4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
);
export const IconoEtiqueta = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.4" />
  </svg>
);
export const IconoAlerta = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </svg>
);
export const IconoOjoCerrado = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-2.6 3.2M6.6 6.6C4.4 8.1 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 4.4-1.2" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
export const IconoCheck = (p: P) => (
  <svg {...base} strokeWidth={2.6} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconoMas = (p: P) => (
  <svg {...base} strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

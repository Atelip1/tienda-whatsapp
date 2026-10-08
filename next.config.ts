import type { NextConfig } from "next";

const seguridad = [
  // RNF-05: el navegador solo usará HTTPS con este sitio (Vercel ya sirve HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Oculta el botón "N" de Next.js que aparece en modo de prueba (npm run dev).
  devIndicators: false,
  async headers() {
    return [
      { source: "/:path*", headers: seguridad },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;

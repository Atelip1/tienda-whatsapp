# Frontend

Lo que se ejecuta en el **navegador** del cliente y de la propietaria.

- `componentes/` — piezas de la interfaz: catálogo, galería, carrito, ventana de promociones.
- `componentes/admin/` — formularios y tablas del panel de la propietaria.
- `lib/imagenes.ts` — comprime y redimensiona las fotos antes de subirlas (RNF-04).
- `lib/supabase-navegador.ts` — conexión desde el navegador (lectura pública y subida de archivos).
- `estilos/globals.css` — diseño y paleta de colores de la marca.

Las páginas (rutas) están en `src/app/`, porque Next.js lo exige así; cada página solo arma
la pantalla con estos componentes y con los datos que entrega el backend.

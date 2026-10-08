# Backend

Lo que se ejecuta en el **servidor** (Vercel). Este código nunca llega al navegador.

- `acciones.ts` — lógica del negocio del panel: valida datos, rechaza códigos repetidos y
  stock negativo, verifica que sea la propietaria y guarda en la base de datos (RF-13 a RF-21).
- `consultas/tienda.ts` — consultas del catálogo público (RF-01 a RF-05).
- `consultas/panel.ts` — consultas del panel (incluye productos ocultos).
- `seguridad.ts` — protege el panel, maneja el subdominio `admin.` y cierra la sesión
  tras 60 minutos sin actividad (RF-13, RNF-06).
- `supabase/` — conexión con la base de datos desde el servidor.

La base de datos (tablas, reglas de seguridad y almacenamiento) está en `supabase/schema.sql`.

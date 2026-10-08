# Catálogo digital con contacto por WhatsApp

Tienda en línea con catálogo, carrito y pedidos por WhatsApp, más un panel privado para la propietaria.

- **Frontend y backend:** Next.js 15 (se publica en Vercel)
- **Base de datos, inicio de sesión y archivos:** Supabase
- **Diseño:** paleta oficial de la marca, con espacio reservado para el logo

---

## 1. Lo que necesitas en tu computadora

- **Node.js 20 o superior** → https://nodejs.org (elige la versión LTS)
- **Git** → https://git-scm.com
- Un editor, por ejemplo **Visual Studio Code**

Para comprobarlo, abre una terminal (en Windows: *PowerShell*) y escribe:

```bash
node -v
git --version
```

## 2. Instalar el proyecto

En la terminal, dentro de la carpeta del proyecto:

```bash
npm install
```

## 3. Preparar Supabase (una sola vez)

1. Entra a https://supabase.com y abre tu proyecto (o crea uno nuevo, región **South America (São Paulo)**).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y presiona **Run**.
   Crea las tablas, las reglas de seguridad, los espacios para imágenes y videos, y tres categorías de ejemplo.
3. Crea la cuenta de la propietaria: **Authentication → Users → Add user → Create new user**
   (correo y contraseña segura, marca *Auto Confirm User*).
4. Dale acceso al panel: abre `supabase/crear-admin.sql`, cambia el correo por el de la propietaria, pégalo en el SQL Editor y presiona **Run**.
5. Desactiva el registro público: **Authentication → Sign In / Providers → Email** y apaga **Allow new users to sign up**.
6. Copia tus claves: **Project Settings → API** (o **Data API**). Necesitas la **Project URL** y la clave **anon public**.

> Las contraseñas las guarda Supabase cifradas (RNF-05). Nunca pegues claves en chats ni las subas a GitHub.

## 4. Configurar las variables

Copia el archivo `.env.example` con el nombre `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
ADMIN_HOST=
NEXT_PUBLIC_LOGO_URL=
```

`ADMIN_HOST` se deja vacío en tu computadora.

## 5. Probar en tu computadora

```bash
npm run dev
```

- Tienda: http://localhost:3000
- Panel: http://localhost:3000/admin (inicia sesión con la cuenta de la propietaria)

Primero entra al panel, revisa el número de WhatsApp y registra algunos productos (cada uno necesita de 3 a 4 fotos).

## 6. Publicar en Vercel

1. Sube el proyecto a un repositorio de GitHub (el archivo `.env.local` **no** se sube; ya está en `.gitignore`).
2. En https://vercel.com → **Add New → Project**, importa el repositorio. Vercel detecta Next.js solo.
3. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `ADMIN_HOST`.
4. Presiona **Deploy**.
5. Recomendado: en **Settings → Functions → Function Region** elige **São Paulo (gru1)**, la misma región que Supabase, para que la tienda cargue más rápido.

### Dominio y subdominio del panel

En Vercel → tu proyecto → **Settings → Domains**, agrega los dos dominios al **mismo proyecto**:

- `tudominio.pe` (y `www.tudominio.pe`) → la tienda
- `admin.tudominio.pe` → el panel

Luego, en **Environment Variables**, pon `ADMIN_HOST=admin.tudominio.pe` y vuelve a desplegar (**Deployments → Redeploy**).

Con eso:
- `admin.tudominio.pe` abre el panel (inicio de sesión).
- `tudominio.pe/admin` ya no existe: el panel solo se abre desde el subdominio.
- La tienda no tiene ningún enlace al panel.

Vercel entrega HTTPS automáticamente en ambos dominios.

## 7. Agregar el logo

Cuando tengas el logo final (PNG con fondo transparente o SVG):

- Opción A: súbelo a Supabase Storage (bucket `promociones`, por ejemplo) y pon su URL en `NEXT_PUBLIC_LOGO_URL`.
- Opción B: guárdalo como `public/logo.png` y pon `NEXT_PUBLIC_LOGO_URL=/logo.png`.

Mientras no exista, se muestra el espacio reservado “Logo de la empresa”.

## 8. Cambiar textos

Los textos de la portada, los beneficios, el pie de página y los mensajes de WhatsApp están en
`src/compartido/config/tienda.ts`. Los colores están al inicio de `src/frontend/estilos/globals.css`.

---

## Estructura: frontend, backend y base de datos

Es un solo proyecto de Next.js (framework *full-stack*), organizado en tres partes:

```
src/
  app/                   Rutas de las páginas (Next.js exige esta carpeta)
    (tienda)/            Catálogo, categoría, producto, carrito
    admin/               Acceso administrativo y panel
  frontend/              Se ejecuta en el NAVEGADOR
    componentes/         Interfaz de la tienda
    componentes/admin/   Interfaz del panel
    lib/                 Compresión de imágenes, conexión desde el navegador
    estilos/             Diseño y paleta de colores
  backend/               Se ejecuta en el SERVIDOR (Vercel)
    acciones.ts          Lógica del negocio: validar, guardar, permisos
    consultas/           Lectura de datos para la tienda y el panel
    seguridad.ts         Protección del panel, subdominio, sesión de 60 min
    supabase/            Conexión con la base de datos
  compartido/            Lo usan frontend y backend
    config/tienda.ts     Textos editables
    formato.ts           Precios y mensajes de WhatsApp
    tipos.ts             Forma de los datos
  middleware.ts          Punto de entrada de seguridad (llama a backend/seguridad.ts)
supabase/                BASE DE DATOS
  schema.sql             Tablas, reglas de seguridad y almacenamiento
  crear-admin.sql        Da acceso al panel a la propietaria
```

Cada carpeta tiene un archivo `LEEME.md` que explica su contenido.

## Cómo se cumplen los requerimientos principales

| Requerimiento | Dónde |
|---|---|
| RF-01, RF-17: solo productos publicados | Reglas RLS en `schema.sql` |
| RF-07, RF-11: mensajes de WhatsApp | `src/compartido/formato.ts` |
| RF-13: sin sesión no hay panel | `src/backend/seguridad.ts` y `src/app/admin/(panel)/layout.tsx` |
| RF-15: código único y validaciones | `src/backend/acciones.ts` + restricción `unique` en la base |
| RF-19: stock 0 ⇒ Agotado | Disparador `products_before_save` en `schema.sql` |
| RNF-04: imágenes comprimidas | `src/frontend/lib/imagenes.ts` (máx. 1200 px, JPEG) |
| RNF-06: sesión de 60 minutos | `src/backend/seguridad.ts` y `src/frontend/componentes/admin/Inactividad.tsx` |
| RNF-09: carrito persistente | `src/frontend/componentes/Carrito.tsx` (almacenamiento del navegador) |
| RNF-10: pagos en el futuro | El carrito y los productos están separados del envío por WhatsApp; se puede agregar un paso de pago sin rehacerlos |

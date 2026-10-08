/**
 * Textos de la tienda. Cámbialos aquí sin tocar el resto del código.
 */
export const TIENDA = {
  nombre: "María Nestarez",
  descripcionCorta: "Ropita, accesorios y juguetes para bebé",
  portada: {
    titulo: "Cositas suaves para tu bebé",
    texto:
      "Elige lo que te guste y envíanos tu pedido por WhatsApp. Te ayudamos con la talla, el pago y la entrega.",
    boton: "Ver productos",
  },
  beneficios: [
    { icono: "corazon", titulo: "Pensado para tu bebé", texto: "Telas suaves y materiales elegidos para su piel." },
    { icono: "escudo", titulo: "Compra con confianza", texto: "Confirmamos el stock antes de coordinar el pago." },
    { icono: "chat", titulo: "Atención directa", texto: "Te responde la dueña de la tienda por WhatsApp." },
  ],
  pie: {
    texto:
      "Ropita, accesorios y juguetes para bebé, elegidos con cariño para acompañar sus primeros años con suavidad y seguridad.",
    pasos: [
      "Elige tus productos en el catálogo.",
      "Envía tu pedido por WhatsApp.",
      "Coordina el pago y la entrega con la tienda.",
    ],
  },
  /** Texto de los mensajes de WhatsApp (SP-05: validar con la propietaria). */
  mensajes: {
    saludoCompra: "Hola, quiero comprar este producto:",
    saludoPedido: "Hola, quiero hacer este pedido:",
    cierre: "¿Me confirmas la disponibilidad?",
  },
} as const;

export const SESION_MINUTOS = 60;
export const MAX_VIDEO_MB = 50;
/** En el panel, un producto con este stock o menos se marca como "stock bajo". */
export const STOCK_BAJO = 3;
/** Número de ejemplo que trae la base de datos; el panel avisa si no se ha cambiado. */
export const NUMERO_EJEMPLO = "51987654321";

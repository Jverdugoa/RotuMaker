# 🗺️ Hoja de Ruta (Roadmap) — RotuMaker

Este documento detalla las funcionalidades planificadas para futuras versiones de RotuMaker, propuestas por **jverdugoa**.

---

## 🎨 Branding Dinámico (Detección de Colores)

El objetivo es que la aplicación se adapte visualmente a la marca de cada cliente de forma automática al subir su logo.

### Concepto Técnico
- **Algoritmo de Extracción**: Utilizar un elemento `<canvas>` invisible para procesar los píxeles del logo subido.
- **Paleta Dominante**: Implementar una lógica de "Color Quantization" (como *Median Cut*) para identificar los 3 colores principales.
- **Inyección de Estilos**:
  - El color más oscuro se asignará a `--color-primary` y a la cabecera del rótulo.
  - El color secundario se usará para acentos y badges.
  - Ajuste automático de contraste para asegurar legibilidad.

---

## 🔌 Integraciones y Automatización

Conectar RotuMaker con el ecosistema de ventas del cliente (CRMs, ERPs, Herramientas de automatización).

### 1. Conector n8n / Webhooks
- **Entrada Automática**: Crear una URL de Webhook que reciba datos de pedidos directamente desde Shopify, WooCommerce o WhatsApp Business.
- **Flujo**: n8n recibe el pedido → envía los datos a RotuMaker → el rótulo aparece automáticamente en la cola listo para imprimir, sin necesidad de copiar/pegar.

### 2. Sincronización con CRM
- **Botón "Imprimir y Marcar"**: Al momento de imprimir el rótulo, la app enviará una señal (POST request) al CRM del cliente para cambiar el estado del pedido a "Empacado" o "Enviado".
- **Tracking**: Posibilidad de adjuntar el número de guía (si existe) de vuelta al CRM.

---

## 🖼️ Personalización de Plantillas

Permitir que el usuario no solo posicione texto sobre un blanco, sino que use sus propios diseños de fondo.

### Funcionalidad
- **Editor de Coordenadas**: Capacidad de subir una imagen de fondo de un rótulo pre-impreso y definir las coordenadas (X, Y) exactas donde la IA debe "escribir" los datos extraídos.
- **Fuentes Personalizadas**: Selección de tipografías más allá de Times New Roman para coincidir con el manual de marca.

---

> [!NOTE]
> Estas funciones están en etapa de planificación y no están implementadas en la versión actual.

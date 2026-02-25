# 📦 RotuMaker

**RotuMaker** es una aplicación web móvil diseñada para simplificar y automatizar la creación de rótulos de envío. Utiliza Inteligencia Artificial para extraer datos directamente desde mensajes de texto (como conversaciones de WhatsApp) y organizarlos en etiquetas listas para imprimir.

---

## 🚀 Funcionalidades Principales

- **Extracción Inteligente (IA):** Pestaña especializada para pegar textos de conversaciones. Soporta modelos de **Groq** (Llama 3) y **Gemini** para identificar automáticamente:
  - Nombre del destinatario.
  - Cédula / ID.
  - Dirección completa.
  - Ciudad y Teléfono.
- **Queue de Rótulos:** Permite ir extrayendo y acumulando hasta 6 rótulos antes de proceder a la impresión.
- **Vista Previa en Tiempo Real:** Visualización del rótulo con tipografía profesional (Times New Roman) y diseño optimizado.
- **Modo Mosaico para Impresión:** Genera hojas tamaño carta con hasta 6 rótulos organizados en 2 columnas, aprovechando al máximo el papel.
- **Configuración Personalizada:**
  - Carga de logo de empresa.
  - Datos de remitente pre-guardados.
  - Elección de proveedor de IA (Groq/Gemini).
- **Privacidad Total:** Todas las API keys y datos se almacenan localmente en el navegador (`localStorage`), sin servidores intermedios.

---

## 🛠️ Especificaciones Técnicas

- **Tecnologías:** HTML5, CSS3 (Vanilla), JavaScript (ES6+), Vite.
- **Mobile First:** Diseño optimizado para navegadores móviles y tablets.
- **Offline Ready:** Una vez configurado, el motor de diseño funciona en el cliente.

---

## 👥 Créditos

- **Planificación y Dirección:** [jverdugoa](https://github.com/jverdugoa)
- **Desarrollo:** Generado íntegramente por IA (Antigravity).

---

## 📋 Cómo empezar

1. Tener Node.js instalado.
2. Ejecutar `npm install`.
3. Iniciar el servidor con `npm run dev`.
4. Configurar tu API Key de Groq o Gemini en los ajustes de la app.

---
*Optimiza tus envíos, un rótulo a la vez.*

## 🗺️ Roadmap (Futuras Mejoras)
Consulta nuestra [Hoja de Ruta](file:///C:/Users/theto/.gemini/antigravity/brain/4dfe4f7b-3e81-4b35-8444-9584031fef7b/roadmap.md) para conocer los planes sobre:
- Detección automática de colores de marca.
- Integración con n8n y CRMs.
- Plantillas de rótulos personalizables.

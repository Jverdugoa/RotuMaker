/**
 * extractor.js
 * Uses Gemini or Groq API to extract label data from raw WhatsApp/text messages
 */

const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Eres un extractor de datos para rótulos de envío colombianos.
Recibirás un fragmento de conversación (puede ser de WhatsApp u otro formato de texto).
Tu tarea es identificar y extraer los siguientes campos:
- nombre: Nombre completo del destinatario
- cedula: Número de cédula o documento de identidad (puede venir como "Cc", "CC", "cédula", "cedula", "c.c.", "dni", etc.)
- direccion: Dirección de entrega completa incluyendo apartamento, conjunto, referencias, etc.
- ciudad: Ciudad de destino
- telefono: Número de teléfono (puede venir como "Tel", "Cel", "Telefono", "celular", etc.)

Reglas importantes:
1. Ignora las marcas de tiempo [DD/M, HH:MM] y los prefijos de usuario (ej: "jkarlospuentes:") de WhatsApp
2. Si un campo no está presente, devuelve string vacío ""
3. Para la cédula, extrae solo los números (sin espacios ni puntos)
4. Para el teléfono, extrae solo los números (sin espacios ni guiones)
5. Responde ÚNICAMENTE con el objeto JSON, sin explicación, sin markdown, sin texto adicional

Ejemplo de entrada:
[24/2, 8:39 p. m.] usuario: Juan Carlos Puerres
[24/2, 8:40 p. m.] usuario: Cc 611231
[24/2, 8:41 p. m.] usuario: Calle 6 # 20E-30 apartamento 801 Conjunto Residencial Versalles
[24/2, 8:42 p. m.] usuario: Bogota
[24/2, 8:43 p. m.] usuario: Telefono 3176746268

Respuesta esperada:
{"nombre":"Juan Carlos Puerres","cedula":"611231","direccion":"Calle 6 # 20E-30 apartamento 801 Conjunto Residencial Versalles","ciudad":"Bogota","telefono":"3176746268"}`;

/**
 * Extract label fields from a raw text message
 * @param {string} rawText
 * @param {string} apiKey
 * @param {'gemini'|'groq'} provider
 */
export async function extractFromMessage(rawText, apiKey, provider = 'gemini') {
    if (!apiKey || apiKey.trim() === '') throw new Error('NO_API_KEY');
    if (!rawText || rawText.trim() === '') throw new Error('EMPTY_TEXT');

    const rawContent = provider === 'groq'
        ? await callGroq(rawText, apiKey)
        : await callGemini(rawText, apiKey);

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('PARSE_ERROR');

    const extracted = JSON.parse(jsonMatch[0]);
    return {
        nombre: String(extracted.nombre || '').trim(),
        cedula: String(extracted.cedula || '').replace(/\D/g, ''),
        direccion: String(extracted.direccion || '').trim(),
        ciudad: String(extracted.ciudad || '').trim(),
        telefono: String(extracted.telefono || '').replace(/\D/g, ''),
    };
}

// ---- Gemini ----
async function callGemini(rawText, apiKey) {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nTexto a analizar:\n${rawText.trim()}` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${res.status}`;
        if (res.status === 400 || res.status === 403) throw new Error('API_KEY_INVALID');
        throw new Error(`API_ERROR: ${msg}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---- Groq ----
async function callGroq(rawText, apiKey) {
    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Texto a analizar:\n${rawText.trim()}` }
            ],
            temperature: 0.1,
            max_tokens: 256
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${res.status}`;
        if (res.status === 401) throw new Error('API_KEY_INVALID');
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`API_ERROR: ${msg}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
}

/**
 * Get a human-readable error message
 */
export function getExtractorErrorMessage(err) {
    const messages = {
        'NO_API_KEY': '⚙️ Configura tu API Key en Ajustes antes de extraer.',
        'EMPTY_TEXT': '📝 El mensaje está vacío. Pega el texto primero.',
        'API_KEY_INVALID': '🔑 La API Key no es válida. Verifica en Ajustes.',
        'PARSE_ERROR': '🤖 No se pudo interpretar la respuesta. Intenta de nuevo.',
        'NETWORK_ERROR': '🌐 Sin conexión. Verifica tu internet.',
        'RATE_LIMIT': '⏱️ Demasiadas solicitudes. Espera un momento.',
    };
    return messages[err.message] || `❌ Error: ${err.message}`;
}

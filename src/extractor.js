/**
 * extractor.js
 * Uses Gemini or Groq API to extract label data from raw WhatsApp/text messages
 */

const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash'
];

const GROQ_MODELS = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama3-8b-8192',
    'llama-3.1-70b-versatile'
];
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Eres un extractor de datos para rótulos de envío colombianos.
Recibirás un fragmento de conversación (puede ser de WhatsApp u otro formato de texto).
Tu tarea es identificar y extraer los siguientes campos:
- nombre: Nombre completo del destinatario
- cedula: Número de cédula o documento de identidad (puede venir como "Cc", "CC", "cédula", "cedula", "c.c.", "dni", etc.)
- direccion: Dirección de entrega. REGLA: Separa la dirección principal (Calle, Cra, Av, etc.) de los complementos (Apto, Conjunto, Bloque, Referencias) usando el separador " | ". Ej: "Calle 10 # 5-20 | Apto 501 Conjunto Versalles".
- ciudad: Ciudad de destino. REGLA: Identifica el departamento de Colombia al que pertenece la ciudad y devuélvelo en formato "Ciudad - Departamento". Ej: "Bogotá - Cundinamarca", "Medellín - Antioquia".
- telefono: Número de teléfono (puede venir como "Tel", "Cel", "Telefono", "celular", etc.)
- notas: Cualquier información adicional sobre el envío o contenido (ej: "frágil", "contenido: ropa", "entregar en portería")

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
[24/2, 8:42 p. m.] usuario: Cali
[24/2, 8:43 p. m.] usuario: Telefono 3176746268

Respuesta esperada:
{"nombre":"Juan Carlos Puerres","cedula":"611231","direccion":"Calle 6 # 20E-30 | Apto 801 Conjunto Residencial Versalles","ciudad":"Cali - Valle del Cauca","telefono":"3176746268","notas":""}`;

/**
 * Extract label fields from a raw text message
 * @param {string} rawText
 * @param {string} apiKey
 * @param {'gemini'|'groq'} provider
 */
export async function extractFromMessage(rawText, apiKey, provider = 'gemini') {
    if (!apiKey || apiKey.trim() === '') throw new Error('NO_API_KEY');
    if (!rawText || rawText.trim() === '') throw new Error('EMPTY_TEXT');

    let rawContent = '';
    try {
        rawContent = provider === 'groq'
            ? await callGroq(rawText, apiKey)
            : await callGemini(rawText, apiKey);
    } catch (err) {
        if (err.message && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
            throw new Error('NETWORK_ERROR');
        }
        throw err;
    }

    // Clean any markdown code fences if returned (e.g. ```json ... ```)
    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // Extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('PARSE_ERROR');

    try {
        const extracted = JSON.parse(jsonMatch[0]);
        return {
            nombre: String(extracted.nombre || '').trim(),
            cedula: String(extracted.cedula || '').trim(),
            direccion: String(extracted.direccion || '').trim(),
            ciudad: String(extracted.ciudad || '').trim(),
            telefono: String(extracted.telefono || '').trim(),
            notas: String(extracted.notas || '').trim(),
        };
    } catch (e) {
        throw new Error('PARSE_ERROR');
    }
}

// ---- Gemini ----
async function callGemini(rawText, apiKey) {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nTexto a analizar:\n${rawText.trim()}` }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
            }

            const err = await res.json().catch(() => ({}));
            const msg = err?.error?.message || `HTTP ${res.status}`;

            if (res.status === 400 || res.status === 403) {
                // If it's specifically an invalid API key, throw immediately
                if (msg.toLowerCase().includes('api_key') || msg.toLowerCase().includes('key not valid')) {
                    throw new Error('API_KEY_INVALID');
                }
            }
            if (res.status === 429) {
                throw new Error('RATE_LIMIT');
            }

            lastError = new Error(`API_ERROR: ${msg}`);
        } catch (e) {
            if (e.message === 'API_KEY_INVALID' || e.message === 'RATE_LIMIT' || e.name === 'TypeError') {
                throw e;
            }
            lastError = e;
        }
    }

    throw lastError || new Error('API_ERROR: No available Gemini models responded');
}

// ---- Groq ----
async function callGroq(rawText, apiKey) {
    let lastError = null;

    for (const model of GROQ_MODELS) {
        try {
            const res = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: `Texto a analizar:\n${rawText.trim()}` }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.1,
                    max_tokens: 1024
                })
            });

            if (res.ok) {
                const data = await res.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content) return content;
            }

            const err = await res.json().catch(() => ({}));
            const msg = err?.error?.message || `HTTP ${res.status}`;

            if (res.status === 401) throw new Error('API_KEY_INVALID');
            if (res.status === 429) throw new Error('RATE_LIMIT');

            // If 404 or model error, continue loop to try fallback models
            lastError = new Error(`API_ERROR: ${msg}`);
        } catch (e) {
            if (e.message === 'API_KEY_INVALID' || e.message === 'RATE_LIMIT' || e.name === 'TypeError') {
                throw e;
            }
            lastError = e;
        }
    }

    throw lastError || new Error('API_ERROR: No available Groq models responded');
}

/**
 * Get a human-readable error message
 */
export function getExtractorErrorMessage(err) {
    const messages = {
        'NO_API_KEY': '⚙️ Configura tu API Key en Ajustes antes de extraer.',
        'EMPTY_TEXT': '📝 El mensaje está vacío. Pega el texto primero.',
        'API_KEY_INVALID': '🔑 La API Key no es válida. Verifica en Ajustes.',
        'PARSE_ERROR': '🤖 No se pudo interpretar la respuesta del modelo. Intenta de nuevo.',
        'NETWORK_ERROR': '🌐 Sin conexión o error de red. Verifica tu internet.',
        'RATE_LIMIT': '⏱️ Límite de solicitudes o cuota excedida. Espera un momento.',
    };
    return messages[err.message] || `❌ Error: ${err.message}`;
}

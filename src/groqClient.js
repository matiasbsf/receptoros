const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = process.env.REACT_APP_GROQ_KEY;

export async function extraerTexto(file) {
  if (!file) return '';
  const nombre = file.name.toLowerCase();

  // Texto plano y CSV
  if (nombre.endsWith('.txt') || nombre.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = ev => resolve(ev.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Word — usar mammoth desde CDN
  if (nombre.endsWith('.docx') || nombre.endsWith('.doc')) {
    return new Promise((resolve, reject) => {
      // Cargar mammoth desde CDN si no está cargado
      if (!window.mammoth) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        script.onload = () => procesarWord(file, resolve, reject);
        script.onerror = () => reject(new Error('No se pudo cargar mammoth'));
        document.head.appendChild(script);
      } else {
        procesarWord(file, resolve, reject);
      }
    });
  }

  // PDF — convertir a txt por ahora
  if (nombre.endsWith('.pdf')) {
    throw new Error('Por favor guarda el PDF como .txt y vuelve a intentarlo');
  }

  // Fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = ev => resolve(ev.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function procesarWord(file, resolve, reject) {
  const reader = new FileReader();
  reader.onload = ev => {
    window.mammoth.extractRawText({ arrayBuffer: ev.target.result })
      .then(r => resolve(r.value))
      .catch(reject);
  };
  reader.onerror = reject;
  reader.readAsArrayBuffer(file);
}

export async function analizarTextoJuridico(texto) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente jurídico especializado en redacción de estampes y certificaciones de receptores judiciales chilenos. 
Tu tarea es analizar el texto de un modelo de estampe y proponer mejoras de redacción jurídica.

Responde SOLO en formato JSON con este esquema exacto, sin texto adicional:
{
  "sugerencias": [
    {
      "original": "texto original a reemplazar",
      "sugerido": "texto mejorado",
      "razon": "explicación breve de la mejora"
    }
  ],
  "evaluacion": "breve evaluación general del texto"
}

Si el texto ya es correcto jurídicamente, devuelve sugerencias vacías y una evaluación positiva.
Propón máximo 3 sugerencias. Usa terminología jurídica chilena precisa.`
        },
        {
          role: 'user',
          content: `Analiza este modelo de estampe y propone mejoras jurídicas:\n\n${texto.replace(/<[^>]+>/g, '')}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })
  });

  if (!response.ok) throw new Error('Error al conectar con Groq');

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { sugerencias: [], evaluacion: 'No se pudo analizar el texto.' };
  }
}

export async function mapearTarifasIA(texto) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente especializado en tarifas de receptores judiciales chilenos.
Tu tarea es analizar un listado de tarifas y mapearlas a tipos estándar.

Los tipos estándar son:
- Notificación Personal
- Notificación por Cédula
- Notificación en Oficina
- Búsqueda
- Requerimiento de Pago (no paga)
- Requerimiento de Pago (si paga)
- Embargo Bienes Muebles
- Embargo Bienes Inmuebles
- Retiro de Bienes Muebles
- Embargo Incautación y Retiro
- Medida Precautoria
- Lanzamiento Precario
- Lanzamiento otros juicios
- Diligencia frustrada

Responde SOLO en formato JSON sin texto adicional:
{
  "tarifas": [
    {
      "tipo_original": "nombre en el documento",
      "tipo_mapeado": "tipo estándar más cercano",
      "valor_sin_imp": número en pesos chilenos sin puntos,
      "confianza": número entre 0 y 100
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analiza estas tarifas y mapéalas:\n\n${texto}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })
  });

  if (!response.ok) throw new Error('Error al conectar con Groq');

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { tarifas: [] };
  }
}

export async function mapearModelosIA(texto) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente especializado en modelos de estampes de receptores judiciales chilenos.
Tu tarea es analizar documentos con modelos de estampe e identificar:
1. El resultado (Positiva, Negativa, Frustrado, Si paga, No paga, etc.)
2. El subtipo (Personal directa, No vive ahí, Falleció, etc.)
3. Las variables entre corchetes como [NOMBRE_DEMANDADO]
4. El texto del modelo con las variables en formato [VARIABLE]

Responde SOLO en formato JSON sin texto adicional:
{
  "modelos": [
    {
      "nombre": "resultado principal",
      "subtipo": "subtipo específico",
      "variables": ["VARIABLE1", "VARIABLE2"],
      "modelo_texto": "texto con <strong>negritas</strong> y [VARIABLES]",
      "confianza": número entre 0 y 100
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analiza estos modelos de estampe:\n\n${texto}`
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    })
  });

  if (!response.ok) throw new Error('Error al conectar con Groq');

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { modelos: [] };
  }
}
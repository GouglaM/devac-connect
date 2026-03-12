import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize AI client
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('❌ GEMINI API KEY NOT CONFIGURED');
    throw new Error('Gemini API key not configured.');
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Helper to retry API calls on transient errors (503, 429)
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T> => {
  let lastError: any;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      // Retry on 503 (Service Unavailable/High Demand) or 429 (Rate Limit)
      if (errorMsg.includes('503') || errorMsg.includes('429')) {
        console.warn(`⏳ [AI DEPLOY] Gemini API Overloaded (Attempt ${i + 1}/${maxRetries}). Next retry in ${delay}ms. Please wait...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Decodes raw PCM bytes from base64
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data for AudioContext
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Concatenates multiple AudioBuffers into one
 */
function concatAudioBuffers(ctx: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) return ctx.createBuffer(1, 1, 24000);
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const result = ctx.createBuffer(buffers[0].numberOfChannels, totalLength, buffers[0].sampleRate);

  for (let channel = 0; channel < result.numberOfChannels; channel++) {
    let offset = 0;
    for (const buffer of buffers) {
      result.getChannelData(channel).set(buffer.getChannelData(channel), offset);
      offset += buffer.length;
    }
  }
  return result;
}

/**
 * Splits text into chunks of roughly equal size, respecting sentences
 */
function splitIntoChunks(text: string, maxLength: number = 1000): string[] {
  const chunks: string[] = [];
  let current = "";
  const sentences = text.split(/([.!?]\s+)/);

  for (const part of sentences) {
    if (current.length + part.length > maxLength) {
      chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Simple text-to-speech for single voice reading
 */
export const readAloud = async (text: string): Promise<AudioBuffer | null> => {
  return withRetry(async () => {
    try {
      const genAI = getAI();
      // Using Pro model for TTS as Flash is often limited/exhausted
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" });

      const MyAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new MyAudioContext({ sampleRate: 24000 });

      // Split long text into chunks to avoid TTS truncation
      const chunks = splitIntoChunks(text, 800);
      const buffers: AudioBuffer[] = [];

      for (const chunk of chunks) {
        const result = await (model as any).generateContent({
          contents: [{ role: 'user', parts: [{ text: `Lis ceci d'une voix inspirante : ${chunk}` }] }],
          generationConfig: {
            responseModalities: ["audio"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        let base64Audio: string | undefined;
        const parts = result.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            base64Audio = part.inlineData.data;
            break;
          }
        }

        if (base64Audio) {
          const audioData = decode(base64Audio);
          const buffer = await decodeAudioData(audioData, audioContext, 24000, 1);
          buffers.push(buffer);
        }
      }

      return buffers.length > 0 ? concatAudioBuffers(audioContext, buffers) : null;
    } catch (error) {
      console.error("Read Aloud Error:", error);
      throw error; // Rethrow to allow withRetry to handle it
    }
  }).catch(() => null);
};

/**
 * Extraction intelligente des cas sociaux à partir d'un texte d'annonce
 */
export const extractSocialCase = async (text: string): Promise<any | null> => {
  return withRetry(async () => {
    try {
      const genAI = getAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Analyse cette annonce et extrais les informations pour une fiche sociale : "${text}".
          Réponds uniquement au format JSON avec les champs suivants : 
          {
            "isSocialCase": boolean,
            "beneficiaryName": string, 
            "beneficiaryFirstName": string, 
            "eventType": "DEATH" | "BIRTH" | "WEDDING" | "SICKNESS" | "OTHER",
            "eventDate": "YYYY-MM-DD",
            "visitDate": "YYYY-MM-DD"
          }`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error("Extraction Error:", error);
      throw error; // Rethrow for withRetry
    }
  }).catch(() => null);
};

/**
 * Generates content using the powerful Gemini Flash Latest model
 */
export const askBibleAssistant = async (
  prompt: string,
  context: string,
  history: any[] = [],
  attachments: { mimeType: string, data: string }[] = []
): Promise<string> => {
  return withRetry(async () => {
    try {
      const genAI = getAI();
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `Tu es Céleste, l'intelligence documentaire et spirituelle de DEVAC.
              
              TON OBJECTIF : 
              Être une assistante de haut niveau pour le Département de l'Évangélisation du Diocèse de Cocody (DEVAC). Tu es experte dans l'analyse de documents (PDF, HTML, CSV, TXT).
              
              RÈGLES DE RÉDACTION (STRICTES) :
              1. STRUCTURE : Utilise TOUJOURS Markdown. Utilise des titres (#, ##), des listes à puces (-), et du gras (**texte**) pour hiérarchiser tes réponses.
              2. PRÉCISION : Si un document est fourni, base tes réponses EXCLUSIVEMENT sur celui-ci tout en apportant ton expertise spirituelle.
              3. ANALYSE DE DONNÉES : Pour les CSV/Listes, sois capable de faire des statistiques (comptages, moyennes).
              4. TON : Professionnel, structuré, rédigé avec soin et élégance missionnaire.
              
              CONTEXTE GLOBAL DE L'APP :
              ${context}`
      });

      // Convert history and attachments to Google's parts format
      let apiHistory = history.map(h => ({
        role: h.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: h.parts[0].text }]
      }));

      if (apiHistory.length > 0 && apiHistory[0].role === 'model') {
        apiHistory.shift();
      }

      const chat = model.startChat({
        history: apiHistory
      });

      const promptParts: any[] = [{ text: prompt }];
      attachments.forEach(att => {
        promptParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });

      const result = await chat.sendMessage(promptParts);
      return result.response.text();
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      throw error; // Rethrow for withRetry
    }
  }).catch((error: any) => {
    if (error.message?.includes('503')) {
      return "⚠️ **Service temporairement surchargé (503)**\n\nGoogle rencontre une forte demande sur ses serveurs. J'ai tenté plusieurs fois de me reconnecter sans succès. Veuillez réessayer dans quelques minutes.";
    }
    if (error.message?.includes('429')) {
      return "⚠️ **Quota dépassé**\n\nLe quota d'utilisation a été atteint. Veuillez réessayer plus tard.";
    }
    return `Désolé, une erreur technique est survenue.\n\n**Détails**: ${error.message || 'Erreur inconnue'}`;
  });
};

/**
 * Génère un dialogue de podcast et le convertit en audio
 */
export const generatePodcastDialogue = async (textContent: string): Promise<AudioBuffer | null> => {
  return withRetry(async () => {
    try {
      const genAI = getAI();

      // [ECO MODE] Raccourcir le script pour rester sous le quota "Free Tier" (approx 1 seule requête TTS)
      const scriptModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const scriptResult = await scriptModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Tu es un scénariste de podcast professionnel. Crée un script de podcast CONCIS intitulé "DEVAC INSIGHTS" d'environ 45-60 secondes.
            
            PERSONNAGES :
            - Marcellin : Le leader évangélisateur charismatique et plein d'anecdotes.
            - Sara : L'analyste structurée qui pose les questions clés.
            
            SUJET : ${textContent.substring(0, 1000)}
            
            DIRECTIVES :
            - Le ton doit être inspirant et naturel.
            - Le texte doit faire environ 150-200 mots maximum pour tenir en un seul bloc audio.`
          }]
        }]
      });

      const script = scriptResult.response.text();
      if (!script) return null;

      // 2. Convertir le script en audio (Pro TTS est plus stable sur le gratuit si on ne le surcharge pas)
      const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" });
      const MyAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new MyAudioContext({ sampleRate: 24000 });

      // [ECO MODE] On limite à des blocs plus gros mais moins nombreux (1 ou 2 max)
      const scriptChunks = splitIntoChunks(script, 1200);
      const audioBuffers: AudioBuffer[] = [];

      for (const chunk of scriptChunks) {
        const audioResult = await (ttsModel as any).generateContent({
          contents: [{ role: 'user', parts: [{ text: chunk }] }],
          generationConfig: {
            responseModalities: ["audio"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        let base64Audio: string | undefined;
        const parts = audioResult.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            base64Audio = part.inlineData.data;
            break;
          }
        }

        if (base64Audio) {
          const buffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
          audioBuffers.push(buffer);
        }
      }

      return audioBuffers.length > 0 ? concatAudioBuffers(audioContext, audioBuffers) : null;
    } catch (error) {
      console.error("Podcast Generation Error:", error);
      throw error;
    }
  }).catch(() => null);
};

/**
 * Génère une méditation audio
 */
export const generateDevotionalPodcast = async (topic: string): Promise<AudioBuffer | null> => {
  return withRetry(async () => {
    try {
      const genAI = getAI();

      // [ECO MODE] Méditation courte (approx 60 secondes)
      const scriptModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const scriptResult = await scriptModel.generateContent({
        contents: [{
          role: 'user', parts: [{
            text: `Rédige une méditation spirituelle apaisante sur : ${topic}. 
        Environ 150 mots maximum. 
        Utilise un langage poétique, plein d'espérance.` }]
        }]
      });

      const script = scriptResult.response.text() || "Prière de paix.";

      const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" });
      const MyAudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new MyAudioContext({ sampleRate: 24000 });

      const chunks = splitIntoChunks(script, 1200);
      const audioBuffers: AudioBuffer[] = [];

      for (const chunk of chunks) {
        const audioResult = await (ttsModel as any).generateContent({
          contents: [{ role: 'user', parts: [{ text: chunk }] }],
          generationConfig: {
            responseModalities: ["audio"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }
              }
            },
          },
        });

        let base64Audio: string | undefined;
        const parts = audioResult.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            base64Audio = part.inlineData.data;
            break;
          }
        }

        if (base64Audio) {
          audioBuffers.push(await decodeAudioData(decode(base64Audio), audioContext, 24000, 1));
        }
      }

      return audioBuffers.length > 0 ? concatAudioBuffers(audioContext, audioBuffers) : null;
    } catch (error) {
      console.error("Devotional Generation Error:", error);
      throw error;
    }
  }).catch(() => null);
};

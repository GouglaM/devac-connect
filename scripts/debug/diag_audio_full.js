import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const withRetry = async (fn, maxRetries = 3, initialDelay = 1500) => {
    let lastError;
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorMsg = error.message || "";
            if (errorMsg.includes('503') || errorMsg.includes('429')) {
                console.log(`⚠️ Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

async function diagnostic() {
    let log = "--- AUDIO PIPELINE DIAGNOSTIC ---\n";
    try {
        // 1. Script Generation
        log += "Step 1: Generating script...\n";
        const scriptModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const scriptRes = await withRetry(() => scriptModel.generateContent("Rédige un court message de bienvenue de 50 mots."));
        const script = scriptRes.response.text();
        log += `✅ Script generated (${script.length} chars)\n`;

        // 2. TTS Generation
        log += "Step 2: Testing TTS (gemini-2.5-flash-preview-tts)...\n";
        const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
        const ttsRes = await withRetry(() => ttsModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: script }] }],
            generationConfig: {
                responseModalities: ["audio"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            }
        }));

        const parts = ttsRes.response.candidates?.[0]?.content?.parts || [];
        const hasAudio = parts.some(p => p.inlineData);
        if (hasAudio) {
            log += "✅ Audio generated successfully\n";
        } else {
            log += "❌ No audio in response parts\n";
        }
    } catch (e) {
        log += `❌ CRITICAL ERROR: ${e.message}\n`;
    }
    fs.writeFileSync('audio_diagnostic.txt', log, 'utf8');
    console.log("Diagnostic complete.");
}

diagnostic();

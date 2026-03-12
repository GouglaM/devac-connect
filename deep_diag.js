import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function deepDiag() {
    let log = "--- DEEP AUDIO DIAGNOSTIC ---\n";
    try {
        // 1. Check Script Generation (Flash 2.0)
        log += "Step 1: Testing gemini-2.0-flash for script...\n";
        const scriptModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const scriptRes = await scriptModel.generateContent("Rédige 20 mots.");
        log += `✅ gemini-2.0-flash OK: "${scriptRes.response.text()}"\n`;

        // 2. Check TTS (Pro Preview)
        log += "Step 2: Testing gemini-2.5-pro-preview-tts...\n";
        const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" });
        const ttsRes = await ttsModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour, c'est un test." }] }],
            generationConfig: {
                responseModalities: ["audio"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });

        const candidates = ttsRes.response.candidates || [];
        if (candidates.length === 0) {
            log += "❌ No candidates found in TTS response.\n";
        } else {
            const parts = candidates[0].content?.parts || [];
            const audioPart = parts.find(p => p.inlineData);
            if (audioPart) {
                log += `✅ gemini-2.5-pro-preview-tts OK: Audio received (${audioPart.inlineData.data.length} bytes)\n`;
            } else {
                log += "❌ No inlineData (audio) in parts. Candidates had: " + JSON.stringify(parts) + "\n";
            }
        }

        // 3. Test without specific voice name
        log += "Step 3: Testing tts without voice name...\n";
        const ttsResSimple = await ttsModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
            generationConfig: { responseModalities: ["audio"] }
        });
        const hasAudioSimple = ttsResSimple.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        log += hasAudioSimple ? "✅ Simple TTS OK\n" : "❌ Simple TTS failed\n";

    } catch (e) {
        log += `❌ ERROR: ${e.message}\n`;
        if (e.response) {
            log += `Response Details: ${JSON.stringify(e.response)}\n`;
        }
    }
    fs.writeFileSync('deep_audio_diag.txt', log, 'utf8');
}

deepDiag();

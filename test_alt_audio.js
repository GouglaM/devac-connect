import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testAlternatives() {
    let log = "--- ALTERNATIVE AUDIO MODELS TEST ---\n";
    const testModels = ["gemini-2.5-pro-preview-tts", "gemini-2.5-flash-native-audio-latest", "gemini-2.0-flash"];

    for (const name of testModels) {
        try {
            log += `Testing ${name}...\n`;
            const model = genAI.getGenerativeModel({ model: name });
            const res = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: "Bienvenue sur DEVAC CONNECT." }] }],
                generationConfig: {
                    responseModalities: ["audio"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' }
                        }
                    }
                }
            });

            const parts = res.response.candidates?.[0]?.content?.parts || [];
            const hasAudio = parts.some(p => p.inlineData);
            if (hasAudio) {
                log += `✅ ${name} : AUDIO OK\n`;
            } else {
                log += `❌ ${name} : No audio data\n`;
            }
        } catch (e) {
            log += `❌ ${name} failed: ${e.message.split('\n')[0]}\n`;
        }
    }
    fs.writeFileSync('alternative_audio_results.txt', log, 'utf8');
    console.log("Test done.");
}

testAlternatives();

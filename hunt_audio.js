import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function findWorkingAudio() {
    let log = "--- SEARCHING FOR WORKING AUDIO MODEL ---\n";
    const candidates = [
        "gemini-2.5-flash-native-audio-latest",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-001",
        "gemini-1.5-flash-8b"
    ];

    for (const name of candidates) {
        try {
            log += `Testing ${name}...\n`;
            const model = genAI.getGenerativeModel({ model: name });
            const res = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
                generationConfig: { responseModalities: ["audio"] }
            });
            const hasAudio = res.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
            if (hasAudio) {
                log += `✅ WORKING: ${name}\n`;
                // Break or continue to find others
            } else {
                log += `❌ ${name} : No audio data returned\n`;
            }
        } catch (e) {
            log += `❌ ${name} error: ${e.message.split('\n')[0]}\n`;
        }
    }
    fs.writeFileSync('working_audio_hunt.txt', log, 'utf8');
}

findWorkingAudio();

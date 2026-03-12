import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function slowTest() {
    let log = "--- SLOW AUDIO TEST (10s DELAY) ---\n";
    try {
        log += "Waiting 10 seconds before starting...\n";
        await new Promise(res => setTimeout(res, 10000));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-tts" });
        log += "Testing models/gemini-2.5-pro-preview-tts...\n";
        const res = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
            generationConfig: { responseModalities: ["audio"] }
        });
        const hasAudio = res.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        log += hasAudio ? "✅ SUCCESS: Audio received after delay!\n" : "❌ FAILURE: No audio data.\n";
    } catch (e) {
        log += "❌ ERROR: " + e.message + "\n";
    }
    fs.writeFileSync('slow_audio_test.txt', log, 'utf8');
}

slowTest();

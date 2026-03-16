import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testFlashAgain() {
    let log = "--- RE-TESTING GEMINI FLASH TTS ---\n";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
        log += "Testing models/gemini-2.5-flash-preview-tts...\n";
        const res = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
            generationConfig: { responseModalities: ["audio"] }
        });
        const hasAudio = res.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        log += hasAudio ? "✅ FLASH TTS WORKING AGAIN\n" : "❌ FLASH TTS STILL NO AUDIO\n";
    } catch (e) {
        log += "❌ ERROR: " + e.message + "\n";
    }
    fs.writeFileSync('flash_tts_retest.txt', log, 'utf8');
}

testFlashAgain();

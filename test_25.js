import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test25() {
    let log = "--- TESTING GEMINI 2.5 FLASH FOR AUDIO ---\n";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        log += "Testing models/gemini-2.5-flash with audio modality...\n";
        const res = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
            generationConfig: { responseModalities: ["audio"] }
        });
        const hasAudio = res.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        if (hasAudio) {
            log += "✅ SUCCESS: gemini-2.5-flash supports audio modality native!\n";
        } else {
            log += "❌ FAILURE: gemini-2.5-flash returned no audio data.\n";
            log += "Full response parts: " + JSON.stringify(res.response.candidates?.[0]?.content?.parts) + "\n";
        }
    } catch (e) {
        log += "❌ ERROR: " + e.message + "\n";
    }
    fs.writeFileSync('test_25_audio.txt', log, 'utf8');
}

test25();

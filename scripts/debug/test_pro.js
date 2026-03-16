import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testPro() {
    let log = "--- TESTING GEMINI PRO LATEST FOR AUDIO ---\n";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        log += "Testing models/gemini-pro-latest with audio modality...\n";
        const res = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Bonjour." }] }],
            generationConfig: { responseModalities: ["audio"] }
        });
        const hasAudio = res.response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
        if (hasAudio) {
            log += "✅ SUCCESS: gemini-pro-latest supports audio modality native!\n";
        } else {
            log += "❌ FAILURE: gemini-pro-latest returned no audio data.\n";
            log += "Full response parts: " + JSON.stringify(res.response.candidates?.[0]?.content?.parts) + "\n";
        }
    } catch (e) {
        log += "❌ ERROR: " + e.message + "\n";
    }
    fs.writeFileSync('test_pro_latest_audio.txt', log, 'utf8');
}

testPro();

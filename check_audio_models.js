import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listAndTest() {
    let log = "--- MODELS CAPABILITIES TEST ---\n";
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        log += "Available Models:\n";
        for (const m of data.models) {
            log += `- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})\n`;
        }

        const testModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-flash-latest"];
        for (const name of testModels) {
            try {
                log += `Testing ${name} for AUDIO...\n`;
                const model = genAI.getGenerativeModel({ model: name });
                const res = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: "Bonjour" }] }],
                    generationConfig: { responseModalities: ["audio"] }
                });
                log += `✅ ${name} supports AUDIO modality!\n`;
            } catch (e) {
                log += `❌ ${name} failed AUDIO: ${e.message.split('\n')[0]}\n`;
            }
        }
    } catch (e) {
        log += `CRITICAL ERROR: ${e.message}\n`;
    }
    fs.writeFileSync('models_audio_capability.txt', log, 'utf8');
    console.log("Test done.");
}

listAndTest();

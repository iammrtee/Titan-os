const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const modelsToCheck = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash-8b"
        ];

        console.log("Starting model availability check...\n");

        for (const modelName of modelsToCheck) {
            try {
                console.log(`Checking [${modelName}]...`);
                // The @google/genai SDK has a slightly different pattern
                // We'll try to generate a tiny content piece
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("hi");
                console.log(`✅ [${modelName}] is AVAILABLE and working.\n`);
            } catch (e) {
                console.log(`❌ [${modelName}] failed. Status: ${e.status}, Message: ${e.message}\n`);
            }
        }
    } catch (err) {
        console.error("Critical failure during diagnostics:", err);
    }
}

listModels();

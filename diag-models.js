const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Manually parse env files for GEMINI_API_KEY
let apiKey = '';
const envFiles = ['.env.local', '.env.production.local', '.env.vercel'];
for (const file of envFiles) {
    try {
        const envPath = path.join(__dirname, file);
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim().replace(/['"]/g, '');
                console.log(`Found API key in ${file}`);
                break;
            }
        }
    } catch (e) { }
}
if (!apiKey) {
    console.warn("Could not find GEMINI_API_KEY in any env file!");
}

async function listModels() {
    try {
        const genAI = new GoogleGenAI({
            apiKey: apiKey,
            apiVersion: 'v1'
        });

        console.log("Listing all available models...");
        try {
            const listResponse = await genAI.models.list();
            console.log("Available models:", JSON.stringify(listResponse, null, 2));
        } catch (e) {
            console.log("❌ Failed to list models:", e.message);
        }

        const modelsToCheck = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite"
        ];

        console.log("\nStarting model availability check...\n");

        for (const modelName of modelsToCheck) {
            try {
                console.log(`Checking [${modelName}]...`);
                // Correct pattern for @google/genai SDK
                const response = await genAI.models.generateContent({
                    model: modelName,
                    contents: "hi"
                });
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

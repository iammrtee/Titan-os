import { GoogleGenAI } from '@google/genai';

export interface StrategyOutput {
    icp: string;
    positioningStatement: string;
    offerAngle: string;
    campaignObjective: string;
    targetPlatforms: string[];
    competitors: { name: string; gap: string }[];
}

export async function runStrategyAgent(input: {
    projectName: string;
    businessDetails: string;
    flyerContent: string;
    positioningData?: string;
}): Promise<StrategyOutput> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are the TitanLeap Senior Venture Architect & Category Designer. Your mission is to analyze this business and architect a high-conviction brand blueprint.

PROJECT: ${input.projectName}
BUSINESS DETAILS: ${input.businessDetails || 'Not provided'}
FLYER CONTENT / OFFER: ${input.flyerContent}
${input.positioningData ? `EXISTING BRAND DNA: ${input.positioningData}` : ''}

Focus on identifying "Category King" potential. Shift from "Agency" messaging to "Growth Intelligence & Category Design".

Output ONLY a valid JSON object with these exact keys:
{
  "icp": "High-conviction Ideal Customer Profile description focusing on psychological triggers, acute pain points, and the 'Dream Outcome'.",
  "positioningStatement": "A world-class positioning statement: For [ICP] who [stagnation/pain], [brand] is the [New Category] that [radical transformation] through [proprietary mechanism].",
  "offerAngle": "A single, 'Irreversible' offer angle that makes saying no feel like a mistake.",
  "campaignObjective": "Primary growth objective (awareness | leads | sales | engagement) with a brief strategic justification.",
  "targetPlatforms": ["instagram", "facebook", "linkedin", "tiktok"],
  "competitors": [
    { "name": "Direct Competitor 1", "gap": "Specific messaging/product gap we exploit" },
    { "name": "Direct Competitor 2", "gap": "Strategic weakness in their category design." }
  ]
}
`;


    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.6 },
    });

    return JSON.parse(response.text || '{}') as StrategyOutput;
}

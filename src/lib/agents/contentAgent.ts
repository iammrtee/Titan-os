import { GoogleGenAI } from '@google/genai';
import { StrategyOutput } from './strategyAgent';

export interface PlatformContent {
  caption: string;
  hook: string;
  cta: string;
}

export interface ContentOutput {
  instagram: PlatformContent;
  facebook: PlatformContent;
  linkedin: PlatformContent;
  tiktok: PlatformContent;
  hooks: string[];
  ctas: string[];
  videoScript: string;
  adCopy: string[];
}

export async function runContentAgent(input: {
  strategy: StrategyOutput;
  flyerContent: string;
  projectName: string;
}): Promise<ContentOutput> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are the TitanLeap Head of Copy & Performance Creative. Your mission is to render competition irrelevant. You don't just write captions; you engineer 'Growth Intelligence' assets.

FRAMEWORK: 'Authority -> Pattern Interrupt -> The Gap -> Transformation'.
TONE: Elite, decisive, strategic (no fluff, no 'I hope').
CORE TECH: AI Growth Agents (Lead Intel + CRM) — the unfair advantage.

PROJECT: ${input.projectName}
ICP: ${input.strategy.icp}
STRATEGIC POSITIONING: ${input.strategy.positioningStatement}
OFFER ANGLE: ${input.strategy.offerAngle}
GROWTH OBJECTIVE: ${input.strategy.campaignObjective}
FLYER MESSAGE: ${input.flyerContent}

Generate high-performance marketing copy. Output ONLY a valid JSON object:
{
  "instagram": {
    "caption": "Instagram caption: Start with a 'Pattern Interrupt' hook, build authority, open a psychological gap, and close with the transformation. (150-200 words, premium emojis, strategic hashtags).",
    "hook": "Scroll-stopping 'Pattern Interrupt' (first 3 lines).",
    "cta": "Irreversible Call to Action (max 8 words)."
  },
  "facebook": {
    "caption": "Facebook story-driven copy: Lead with a 'Vulnerability to Victory' narrative or a contrarian insight. (200-300 words).",
    "hook": "Empathy-led problem hook.",
    "cta": "Direct Response CTA."
  },
  "linkedin": {
    "caption": "LinkedIn Thought Leadership: Contrarian perspective or data-backed insight that challenges industry norms. (200 words).",
    "hook": "Authority-building opening line.",
    "cta": "Professional Growth CTA."
  },
  "tiktok": {
    "caption": "TikTok high-energy caption: Short, punchy, trend-aware, focusing on 'Speed to Result'. (50-80 words).",
    "hook": "Instant curiosity hook (0-1s).",
    "cta": "Socialized CTA."
  },
  "hooks": [
    "High-Conviction Hook 1",
    "Contrarian Hook 2",
    "Result-First Hook 3",
    "Curiosity-Gap Hook 4",
    "Identify-First Hook 5"
  ],
  "ctas": [
    "Transformation-led CTA",
    "Scarcity-led CTA", 
    "Logic-led CTA"
  ],
  "videoScript": "60-second Viral Storytelling Script: [PATTERN INTERRUPT], [AUTHORITY BUILD], [THE GAP], [REVEAL], [CTA] - clearly labeled.",
  "adCopy": [
    "Short Performance Ad (Killer Headline + 1 sentence)",
    "Medium Strategic Ad (Headline + 2-3 sentences)",
    "Long Narrative Ad (Headline + full story paragraph)"
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.7 },
  });

  return JSON.parse(response.text || '{}') as ContentOutput;
}

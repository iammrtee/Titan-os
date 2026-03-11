import { GoogleGenAI } from '@google/genai';
import { StrategyOutput } from './strategyAgent';
import { ContentOutput } from './contentAgent';

export interface CalendarDay {
  day: number;
  platform: string;
  contentType: 'caption' | 'hook' | 'cta' | 'video_script' | 'ad_copy';
  contentBody: string;
  scheduledFor?: string; // ISO date string
  status: 'draft';
}

export async function runCalendarAgent(input: {
  strategy: StrategyOutput;
  content: ContentOutput;
  projectName: string;
  startDate?: string; // ISO date, defaults to today
}): Promise<CalendarDay[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const startDate = input.startDate || new Date().toISOString().split('T')[0];

  // Pre-build a content pool from the generated content
  const contentPool = JSON.stringify({
    instagramCaption: input.content.instagram.caption,
    instagramHook: input.content.instagram.hook,
    facebookCaption: input.content.facebook.caption,
    linkedinCaption: input.content.linkedin.caption,
    tiktokCaption: input.content.tiktok.caption,
    hooks: input.content.hooks,
    ctas: input.content.ctas,
    videoScript: input.content.videoScript,
    adCopy: input.content.adCopy,
  });

  const prompt = `You are the TitanLeap Growth Operations Lead. Your mission is to architect a 30-day 'Velocity-Based' content distribution calendar that builds compounding authority.

PROJECT: ${input.projectName}
GROWTH OBJECTIVE: ${input.strategy.campaignObjective}
TARGET PLATFORMS: ${input.strategy.targetPlatforms.join(', ')}
LAUNCH DATE: ${startDate}
CONTENT ASSET POOL: ${contentPool}

Deployment Rules:
- Execute 2-3 strategic touchpoints per day.
- Platform Omni-presence: Rotate platforms to avoid fatigue.
- Compounding Narrative Phase:
  - Week 1: Authority Building & Pattern Interrupts.
  - Week 2: Psychological Gap Opening (Problem/Solution).
  - Week 3: Proof-Led Escalation (Social Proof & Case Studies).
  - Week 4: High-Velocity Conversion (Irreversible CTAs).

Output ONLY a JSON array of exactly 30 objects:
[
  {
    "day": 1,
    "platform": "instagram",
    "contentType": "caption",
    "contentBody": "Exact engineered copy for publication",
    "scheduledFor": "YYYY-MM-DD",
    "status": "draft"
  }
]

Adapt the ASSET POOL content to fit the daily phase. Precision is non-negotiable.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.5 },
  });

  const parsed = JSON.parse(response.text || '[]');
  return parsed.slice(0, 30) as CalendarDay[];
}

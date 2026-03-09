import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type {
    WebsiteAnalysisOutput,
    PositioningResult,
    FunnelResult,
    ContentCalendarResult,
    AdCampaignsResult,
    ContentAssetsResult,
} from '@/types';
import {
    websiteAnalysisPrompt,
    positioningPrompt,
    funnelPrompt,
    contentCalendarPrompt,
    adCampaignsPrompt,
    contentAssetsPrompt,
} from '@/prompts/chain-prompts';

// ─── Helper: Call Gemini and parse JSON ───────────────────────

async function callGemini<T>(prompt: string): Promise<T> {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const ai = new GoogleGenAI({
        apiKey: apiKey,
    });

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
        },
    });

    const content = response.text;
    if (!content) throw new Error('Gemini returned empty response');

    return JSON.parse(content) as T;
}

// ─── Chain Step Executors ────────────────────────────────────

export async function runWebsiteAnalysis(
    websiteUrl: string,
    businessDetails: string,
): Promise<WebsiteAnalysisOutput> {
    const prompt = websiteAnalysisPrompt(websiteUrl, businessDetails);
    return callGemini<WebsiteAnalysisOutput>(prompt);
}

export async function runPositioning(
    analysis: WebsiteAnalysisOutput,
    businessDetails: string,
): Promise<PositioningResult> {
    const prompt = positioningPrompt(analysis, businessDetails);
    return callGemini<PositioningResult>(prompt);
}

export async function runFunnel(
    analysis: WebsiteAnalysisOutput,
    positioning: PositioningResult,
    currentFunnel?: string,
): Promise<FunnelResult> {
    const prompt = funnelPrompt(analysis, positioning, currentFunnel);
    return callGemini<FunnelResult>(prompt);
}

export async function runContentCalendar(
    positioning: PositioningResult,
    funnel: FunnelResult,
    businessName: string,
    niche: string,
    targetAudience: string,
): Promise<ContentCalendarResult> {
    const prompt = contentCalendarPrompt(positioning, funnel, businessName, niche, targetAudience);
    return callGemini<ContentCalendarResult>(prompt);
}

export async function runAdCampaigns(
    positioning: PositioningResult,
    funnel: FunnelResult,
): Promise<AdCampaignsResult> {
    const prompt = adCampaignsPrompt(positioning, funnel);
    return callGemini<AdCampaignsResult>(prompt);
} export async function runContentAssets(
    positioning: PositioningResult,
    calendar: ContentCalendarResult,
): Promise<ContentAssetsResult> {
    const prompt = contentAssetsPrompt(positioning, calendar);
    return callGemini<ContentAssetsResult>(prompt);
}


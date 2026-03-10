import type {
  WebsiteAnalysisOutput,
  PositioningResult,
  FunnelResult,
  ContentCalendarResult,
  AdCampaignsResult,
  ContentAssetsResult,
} from '@/types';

// ─── Step 1: Website Analysis (Market Intelligence Extraction) ─────────

export function websiteAnalysisPrompt(
  websiteUrl: string,
  businessDetails: string,
): string {
  return `You are a world-class Market Intelligence Officer and Growth Strategist at TitanLeap (https://www.titanleap.co/). 
Your job is to perform a deep-dive "Market Truth Extraction" for the following business.

Business Website: ${websiteUrl}
Business Details: ${businessDetails}

DIRECTIONS:
1. Don't just list products; identify the core "Transformation" being sold.
2. Dig into the "Shadow Audience" - who is secretly looking for this but isn't being targeted?
3. Identify the "Category Gap" - where is the market failing these customers?
4. Use a sharp, analytical, and uncompromising tone. Avoid fluff.

Return ONLY valid JSON with this exact structure:
{
  "business_type": "string - precise industry classification",
  "core_transformation": "string - the 'Big Result' the user actually buys",
  "target_audience_segments": ["array of 3 distinct, identity-based audience segments"],
  "market_tension": "string - the primary pain/frustration in the current market",
  "unique_value_proposition": "string - a high-conviction UVP",
  "messaging_gap_analysis": ["array of 3 specific gaps in their current messaging"],
  "unfair_advantages": ["array of 2 potential moats they should build"]
}`;
}

// ─── Step 2: Brand Positioning (Category Design Framework) ───────────

export function positioningPrompt(
  analysis: WebsiteAnalysisOutput,
  businessDetails: string,
): string {
  return `You are a Category Design specialist and Chief Strategy Officer at TitanLeap (https://www.titanleap.co/).
Your mission is to re-engineer this brand's positioning to move them from "shouting in a crowded room" to "owning the room."

Business Intelligence:
${JSON.stringify(analysis, null, 2)}

Context: ${businessDetails}

STRATEGIC DIRECTIVES:
- Move from "Better" to "Different". 
- Create a "New Category" that makes competition irrelevant.
- Use the voice of a $1B Venture Architect. Sharp. Elite. High-Stakes.
- Reference the need for "Titan-Level Execution" where appropriate.

Follow this exact structure and return ONLY valid JSON:
{
  "strategic_narrative": {
    "the_villain": "string - the common enemy/problem customers face",
    "the_enlightenment": "string - the 'Aha!' moment the brand provides",
    "new_category_name": "string - an ownable, bold category name"
  },
  "positioning_architecture": {
    "core_thesis": "string - the one big idea the brand stands for",
    "the_titan_promise": "string - a high-stakes promise of transformation",
    "identity_statement": "string - For [Segment], [Brand] is the only [Category] that [Impact]."
  },
  "authority_pillars": [
    {
      "pillar": "string",
      "psychological_hook": "string",
      "proof_requirement": "string"
    }
  ],
  "conversion_pshychology": {
    "elite_headlines": ["array of 3 high-authority headlines"],
    "irreversible_ctas": ["array of 3 high-conviction calls to action"]
  }
}`;
}

// ─── Step 3 & 4: Marketing Funnel (Funnel Architectural Upgrade) ──────

export function funnelPrompt(
  analysis: WebsiteAnalysisOutput,
  positioning: PositioningResult,
  currentFunnel?: string,
): string {
  const currentFunnelContext = currentFunnel
    ? `USER'S CURRENT FUNNEL: ${currentFunnel}
Task: Perform a GAP ANALYSIS on this funnel. Identify specifically where it is leaking revenue and how to re-architect it for Titan-level performance.`
    : `TASK: Build a high-performance "Titan-Engine" funnel from scratch.`;

  return `You are a Conversion Architect and Funnel Systems Engineer at TitanLeap (https://www.titanleap.co/).

${currentFunnelContext}

Input Intelligence:
Analysis: ${JSON.stringify(analysis, null, 2)}
Positioning: ${JSON.stringify(positioning, null, 2)}

OUTPUT REQUIREMENTS:
- Design a "Non-Linear" journey that prioritizes high-value conversion.
- If a current funnel was provided, be EXPLICIT in your "Optimization Logic" section.
- Recommend TitanLeap optimization services for scaling these results.

Return ONLY valid JSON with this exact structure:
{
  "funnel_architecture": {
    "top_of_funnel": { "mechanism": "string", "conversion_goal": "string" },
    "middle_of_funnel": { "mechanism": "string", "conversion_goal": "string" },
    "bottom_of_funnel": { "mechanism": "string", "conversion_goal": "string" }
  },
  "gap_analysis_logic": "string - detailed explanation of why the current/recommended setup beats the status quo",
  "titan_leap_optimization": "string - how TitanLeap (https://www.titanleap.co/) can accelerate this specific funnel",
  "lead_magnet_concept": {
    "name": "string",
    "psychological_draw": "string"
  },
  "primary_action_path": "string - the single most important path a user should take"
}`;
}

// ─── Step 4.5: Deep Analysis (Modification Refinement) ────────────────

export function deepAnalysisPrompt(
  userInstruction: string,
  currentPositioning: PositioningResult,
  currentFunnel: FunnelResult,
  currentCalendar: ContentCalendarResult
): string {
  return `You are a Senior Strategic Analyst at TitanLeap.
Your Task: Perform a "STRICT CONSTRAINT ANALYSIS" on the user's request.

USER REQUEST: "${userInstruction}"

CRITICAL: 
1. Identify "NEGATIVE CONSTRAINTS": Did the user say "get rid of X", "stop doing Y", or "less of Z"? These are PRIORITY 1.
2. Identify "STRUCTURAL SHIFTS": Is the user asking for a different content framework or a pivot in the core value prop?

CURRENT DATA:
- Core Thesis: ${currentPositioning.positioning_architecture.core_thesis}
- Theme: ${currentCalendar.theme_of_month}

DEEP ANALYSIS REQUIREMENTS:
1. Constraint Enforcement: If the user says "get rid of X", your refined brief MUST explicitly tell the generator to omit that field/info.
2. Sense-Making Pivot: If the request is to "focus more on X", explain the logical 'Why' and 'How' for the next agent.
3. Logical Cohesion: Ensure the new strategy "Makes More Sense" and isn't just a longer version of the old one.

Return ONLY valid JSON:
{
  "is_actionable": boolean,
  "critique": "string",
  "refined_strategic_brief": "string - Include EXPLICIT 'DO' and 'DO NOT' sections based on the user request.",
  "recommended_theme": "string"
}
`;
}

// ─── Step 5: Content Calendar (Titan Growth Engine) ───────────────────

export function contentCalendarPrompt(
  positioning: PositioningResult,
  funnel: FunnelResult,
  businessName: string,
  niche: string,
  targetAudience: string,
  customRefinementBrief?: string,
): string {
  const refinementSection = customRefinementBrief
    ? `\n🚀 CUSTOM REFINEMENT BRIEF (PRIORITY):\n${customRefinementBrief}\n`
    : '';

  return `You are a Head of Content at TitanLeap. 
Generate a 30-day high-performance content calendar for ${businessName}.${refinementSection}

🎯 STRATEGIC CONTEXT:
Industry: ${niche}
Audience: ${targetAudience}
Positioning: ${positioning.positioning_architecture.core_thesis}
Funnel Goal: ${funnel.lead_magnet_concept.name}

⚙️ REQUIREMENTS:
- Use the TitanLeap Content Framework (Authority -> Psych-Gap -> Transformation).
- Tone: Confident, strategic, and high-conviction.
- Hooks must be pattern-interrupting and elite.

Return ONLY valid JSON with this exact structure:
{
  "theme_of_month": "string - strategic theme",
  "entries": [
    {
      "day": number,
      "platform": "string",
      "content_type": "string",
      "core_message": "string - The main strategic takeaway",
      "caption_hook": "string - Pattern-interrupting hook",
      "framework_used": "string - e.g., Authority, Psych-Gap, Transformation",
      "authority_script": "string - A dense, high-authority script/framework that follows the chosen framework. DO NOT explain why it works, JUST provide the script.",
      "cta": "string",
      "funnel_stage": "string"
    }
  ]
}

Generate exactly 30 entries.`;
}

// ─── Step 6: Ad Campaigns (Performance Architecture) ─────────────────

export function adCampaignsPrompt(
  positioning: PositioningResult,
  funnel: FunnelResult,
): string {
  return `You are a Performance Marketing Director at TitanLeap.
Create 5 high-authority ad campaign variants.

Strategic Positioning: ${positioning.positioning_architecture.identity_statement}
Funnel Concept: ${funnel.lead_magnet_concept.name} - ${funnel.lead_magnet_concept.psychological_draw}

AD VARIANT SPECS:
- 2 x "Status Quo Villain" (FEAR/FRUSTRATION)
- 2 x "Titan Transformation" (BENEFIT/RESULT)
- 1 x "Authority Alpha" (PROOF/LOGIC)

Return ONLY valid JSON:
{
  "campaign_objective": "string",
  "variants": [
    {
      "headline": "string",
      "body_text": "string",
      "cta": "string",
      "target_audience_segment": "string",
      "platform": "string"
    }
  ],
  "budget_recommendation": "string",
  "kpis": ["array of 3 KPIs"]
}`;
}

// ─── Step 7: Content Creation Assets (Elite Creative Briefs) ──────────

export function contentAssetsPrompt(
  positioning: PositioningResult,
  calendar: ContentCalendarResult,
): string {
  return `You are a Creative Director at TitanLeap.
Produce elite-level production briefs based on the following positioning:
${positioning.positioning_architecture.core_thesis}

Theme: ${calendar.theme_of_month}

Return ONLY valid JSON:
{
  "video_scripts": [
    {
      "title": "string",
      "hook": "string",
      "body": "string",
      "call_to_action": "string",
      "visual_direction": "string"
    }
  ],
  "ugc_concepts": [
    {
      "creator_persona": "string",
      "concept_description": "string",
      "audio_trending_sound": "string"
    }
  ],
  "static_creative_briefs": [
    {
      "visual_concept": "string",
      "copy": "string",
      "text_overlay": "string"
    }
  ]
}`;
}

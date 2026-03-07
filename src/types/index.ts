// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'pro' | 'growth' | 'starter';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    created_at: string;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Project {
    id: string;
    user_id: string;
    name: string;
    website_url: string;
    business_details: string;
    status: ProjectStatus;
    created_at: string;
}

export interface CreateProjectInput {
    name: string;
    website_url: string;
    business_details: string;
}

// ─── AI Output Tables ─────────────────────────────────────────────────────────

export interface WebsiteAnalysis {
    id: string;
    project_id: string;
    raw_content: string;
    analysis_json: WebsiteAnalysisOutput | null;
}

export interface PositioningOutput {
    id: string;
    project_id: string;
    positioning_json: PositioningResult | null;
}

export interface FunnelOutput {
    id: string;
    project_id: string;
    funnel_json: FunnelResult | null;
}

export interface ContentCalendar {
    id: string;
    project_id: string;
    calendar_json: ContentCalendarResult | null;
}

export interface AdCampaigns {
    id: string;
    project_id: string;
    campaigns_json: AdCampaignsResult | null;
}

export interface ContentAssetsOutput {
    id: string;
    project_id: string;
    assets_json: ContentAssetsResult | null;
}

// ─── AI Structured Output Schemas ────────────────────────────────────────────

export interface WebsiteAnalysisOutput {
    business_type: string;
    core_transformation: string;
    target_audience_segments: string[];
    market_tension: string;
    unique_value_proposition: string;
    messaging_gap_analysis: string[];
    unfair_advantages: string[];
}

export interface PositioningResult {
    strategic_narrative: {
        the_villain: string;
        the_enlightenment: string;
        new_category_name: string;
    };
    positioning_architecture: {
        core_thesis: string;
        the_titan_promise: string;
        identity_statement: string;
    };
    authority_pillars: {
        pillar: string;
        psychological_hook: string;
        proof_requirement: string;
    }[];
    conversion_psychology: {
        elite_headlines: string[];
        irreversible_ctas: string[];
    };
    strategic_blueprint?: {
        icp: string;
        offer_angle: string;
        campaign_objective: string;
    };
}

export interface FunnelResult {
    funnel_architecture: {
        top_of_funnel: { mechanism: string; conversion_goal: string };
        middle_of_funnel: { mechanism: string; conversion_goal: string };
        bottom_of_funnel: { mechanism: string; conversion_goal: string };
    };
    gap_analysis_logic: string;
    titan_leap_optimization: string;
    lead_magnet_concept: {
        name: string;
        psychological_draw: string;
    };
    primary_action_path: string;
}

export interface ContentCalendarEntry {
    day: number;
    platform: string;
    content_type: string;
    topic?: string;
    core_message?: string;
    caption_hook: string;
    framework_used?: string;
    cta?: string;
    funnel_stage?: string;
    why_this_converts?: string;
}

export interface ContentCalendarResult {
    theme_of_month: string;
    entries: ContentCalendarEntry[];
}

export interface AdVariant {
    headline: string;
    body_text: string;
    cta: string;
    target_audience_segment: string;
    platform: string;
}

export interface AdCampaignsResult {
    campaign_objective: string;
    variants: AdVariant[];
    budget_recommendation: string;
    kpis: string[];
}

export interface ContentAssetsResult {
    video_scripts: {
        title: string;
        hook: string;
        body: string;
        call_to_action: string;
        visual_direction: string;
    }[];
    ugc_concepts: {
        creator_persona: string;
        concept_description: string;
        audio_trending_sound: string;
    }[];
    static_creative_briefs: {
        visual_concept: string;
        copy: string;
        text_overlay: string;
    }[];
}

// ─── AI Chain Step Types ──────────────────────────────────────────────────────

export type ChainStep =
    | 'website_analysis'
    | 'positioning'
    | 'funnel'
    | 'content_calendar'
    | 'ad_campaigns'
    | 'content_assets';

export interface ChainStepStatus {
    step: ChainStep;
    status: 'pending' | 'running' | 'done' | 'error';
    label: string;
}

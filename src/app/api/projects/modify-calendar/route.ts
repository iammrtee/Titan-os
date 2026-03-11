import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import {
    runDeepAnalysis,
    runContentCalendar,
    runContentAssets,
} from '@/ai/chain';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, customInstruction, updateAssets = false } = await request.json();
    if (!projectId || !customInstruction) {
        return NextResponse.json({ error: 'Missing projectId or instruction' }, { status: 400 });
    }

    try {
        // Fetch existing data needed for context
        const { data: project } = await supabase
            .from('projects')
            .select('name, business_details')
            .eq('id', projectId)
            .single();

        const { data: analysis } = await supabase
            .from('website_analysis')
            .select('analysis_json')
            .eq('project_id', projectId)
            .single();

        const { data: positioning } = await supabase
            .from('positioning_output')
            .select('positioning_json')
            .eq('project_id', projectId)
            .single();

        const { data: funnel } = await supabase
            .from('funnel_output')
            .select('funnel_json')
            .eq('project_id', projectId)
            .single();

        const { data: calendarData } = await supabase
            .from('content_calendar')
            .select('calendar_json')
            .eq('project_id', projectId)
            .single();

        if (!project || !analysis || !positioning || !funnel || !calendarData) {
            return NextResponse.json({ error: 'Project context not found' }, { status: 404 });
        }

        // STEP 1: Deep Analysis
        const analysisResult = await runDeepAnalysis(
            customInstruction,
            positioning.positioning_json,
            funnel.funnel_json,
            calendarData.calendar_json
        );

        if (!analysisResult.is_actionable) {
            return NextResponse.json({
                success: false,
                error: analysisResult.critique,
                reason: 'vague_prompt'
            }, { status: 422 });
        }

        // STEP 2: Regeneration (Calendar)
        const newCalendar = await runContentCalendar(
            positioning.positioning_json,
            funnel.funnel_json,
            project.name,
            analysis.analysis_json.business_type,
            analysis.analysis_json.target_audience_segments?.[0] || 'Target Audience',
            analysisResult.refined_strategic_brief
        );

        // STEP 3: Optional Regeneration (Assets)
        let newAssets = null;
        if (updateAssets) {
            newAssets = await runContentAssets(
                positioning.positioning_json,
                newCalendar
            );
        }

        // Update database
        await supabase.from('content_calendar').upsert({
            project_id: projectId,
            calendar_json: newCalendar,
        });

        if (newAssets) {
            await supabase.from('content_assets').upsert({
                project_id: projectId,
                assets_json: newAssets,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                calendar: newCalendar,
                assets: newAssets,
                analysisRefinement: analysisResult.refined_strategic_brief
            },
        });

    } catch (error: any) {
        console.error('[Modify Calendar Error]', error);
        return NextResponse.json(
            { error: error?.message || 'Modification failed' },
            { status: 500 },
        );
    }
}

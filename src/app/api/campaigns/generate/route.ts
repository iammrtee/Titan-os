import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runOrchestrator } from '@/lib/agents/orchestrator';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const {
            projectId, projectName, businessDetails,
            flyerContent, flyerImageUrl, flyerStyle, positioningData
        } = await req.json();

        if (!projectId || !flyerContent) {
            return NextResponse.json({ error: 'projectId and flyerContent are required' }, { status: 400 });
        }

        // Stream SSE response back to client
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    const gen = runOrchestrator({
                        projectId, projectName: projectName || 'Project',
                        businessDetails: businessDetails || '',
                        flyerContent, flyerImageUrl, flyerStyle, positioningData
                    });

                    for await (const event of gen) {
                        send(event);
                        if (event.stage === 'complete' || event.stage === 'error') break;
                    }
                } catch (err: any) {
                    send({ stage: 'error', message: err?.message || 'Unknown error' });
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
    }
}

import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const apiKey = (process.env.GEMINI_API_KEY || '').trim();
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server configuration error: Gemini API Key missing.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({
            apiKey: apiKey,
        });

        const body = await req.json();
        const {
            topic, core_message, hook, projectName, style, color, customContent,
            characterGender, characterEthnicity, hairStyle, outfitDescription,
            facialExpression, poseDescription, primaryObject, ctaButtonText,
            logoText, bottomLeftText, footerText, labelText, headlineText,
            referenceImageUrl
        } = body;

        console.log(`[FlyerGen] Starting generation for style: ${style}, project: ${projectName}`);

        // Use core_message as fallback if topic is empty
        const activeTopic = topic || core_message;

        // If not using customContent, a topic/message and hook are required for default generation
        if (!customContent && (!activeTopic || !hook)) {
            return NextResponse.json({ error: 'Topic and hook or customContent are required.' }, { status: 400 });
        }

        // Style 1: Premium Gradient - Refined for professional SaaS look
        let finalPrompt = `A premium marketing poster with a vibrant, sleek ${color || 'purple'} gradient background. The top half features massive, clean, bold white text saying exactly: "${hook || 'Marketing'}". The bottom half features a high-end 3D marketing icon and abstract geometric glass shapes in the background. Professional lighting, 8k resolution, modern SaaS brand aesthetic.`;
        let activeAspectRatio = '3:4'; // default

        if (style === 'style-1') {
            // Step 1: Use Gemini to fill out the user's requested JSON variables
            let contentSource = customContent
                ? `Custom Content: ${customContent}`
                : `Post Topic: ${topic}\nHeadline Hook: ${hook}`;

            const colorIntelligence = color
                ? `The user's brand color is: "${color}". You MUST derive all colors from this:
- primary_color_name: An extremely dark near-black deep version of this color for the background (e.g. deep navy from blue, deep charcoal from grey, deep crimson from red)
- accent_color_name: A vivid electric bright version of this color (neon/saturated — for the pill highlight, accents, and glow)
- gradient_pair: Two close tones of this color for smooth gradient background (dark version + slightly lighter version)
- pill_color: The bright vivid neon version of the brand color used for the headline keyword pill shape`
                : `No brand color specified — choose a professional color palette befitting the content topic.`;

            const visionIntelligence = referenceImageUrl
                ? `The user has provided a reference image for visual inspiration.
- You MUST analyze the reference image's color palette, atmosphere, lighting, and composition.
- Derive the primary colors and visual "vibe" primarily from this reference image.
- Ensure the generated flyer feels familiar and stylistically consistent with the provided reference, while still following the "Premium Gradient" template.`
                : '';

            const templatePrompt = `You are an elite art director and visual analyst. Your task is to perform a DEEP ANALYSIS of BOTH the provided inspiration image and the content idea text to extract its core visual and conceptual DNA.
            
            EXTRACT DETAILED VISUAL & CONCEPTUAL DATA:
            1. primary_color_hex: extract accurate hex codes from the image/content
            2. secondary_color_hex: extract supporting accent hex codes
            3. lighting_atmosphere: describe the specific lighting and mood (e.g. "cinematic rim lighting", "soft pastel morning glow")
            4. texture_material: describe surface qualities (e.g. "frosted refractive glass", "matte obsidian")
            5. composition_layout: describe spatial arrangement (e.g. "dynamic diagonal tension")
            6. artistic_style: 1-sentence summary of the medium and aesthetic
            7. conceptual_anchor: The main visual metaphor derived from analyzing the content idea: ${contentSource}
            8. primary_3d_object: Identify the MAIN PHYSICAL SUBJECT/OBJECT present in the reference image (is it a man? woman? child? robotic hand? shiny orb? mascot? animal?). Describe it as a stylized high-end 3D model that also visually represents the content anchor: ${contentSource}
            9. secondary_3d_object: A smaller accent object reinforcing the theme
            10. headline_line_1: Most impactful part of the text
            11. headline_line_2: Supporting part of the headline
            12. supporting_statement: A short subheadline for the footer area

            Output ONLY a JSON object with these EXACT keys.`;

            let geminiContents: any = templatePrompt;

            if (referenceImageUrl) {
                try {
                    const imgRes = await fetch(referenceImageUrl);
                    const buffer = await imgRes.arrayBuffer();
                    const b64 = Buffer.from(buffer).toString('base64');
                    const mime = imgRes.headers.get('content-type') || 'image/jpeg';

                    geminiContents = [
                        { text: templatePrompt },
                        { inlineData: { data: b64, mimeType: mime } }
                    ];
                } catch (err) {
                    console.error("Failed to fetch reference image:", err);
                }
            }

            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: geminiContents,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                },
            });

            const cleanValue = (s: string) => {
                if (!s) return '';
                return s.replace(/[—\-_:*]/g, '').replace(/["'*]/g, '').trim();
            };

            const vars = JSON.parse(geminiResponse.text || '{}');

            // Extraction with fallbacks
            let head1 = cleanValue(vars.headline_line_1 || vars.headline_text || '');
            let head2 = cleanValue(vars.headline_line_2 || '');
            let sub = cleanValue(vars.supporting_statement || '');
            let obj1 = cleanValue(vars.primary_3d_object || '');
            let obj2 = cleanValue(vars.secondary_3d_object || '');
            const anchor = cleanValue(vars.conceptual_anchor || '');
            let logo = cleanValue(projectName || 'The Brand');

            // Deep Visual DNA
            const activeColor = color || vars.primary_color_hex || vars.primary_color_name || 'deep purple';
            const lighting = cleanValue(vars.lighting_atmosphere || 'professional studio lighting');
            const materials = cleanValue(vars.texture_material || 'premium surfaces');
            const composition = cleanValue(vars.composition_layout || 'modern balanced layout');
            const styleLabel = cleanValue(vars.artistic_style || 'modern marketing aesthetic');

            if (headlineText) {
                const lines = headlineText.split('\n').map((l: string) => l.trim()).filter(Boolean);
                head1 = lines[0] || headlineText;
                head2 = lines[1] || '';
            }

            // If a primaryObject is manually provided, it replaces the AI-extracted object.
            // If it's a manual override, we assume the user wants THIS object to be the focus.
            if (primaryObject) {
                obj1 = primaryObject.trim();
            }

            if (logoText) logo = logoText.trim();
            if (footerText) {
                sub = footerText.trim();
            } else if (headlineText && customContent) {
                // If headline is manual, map customContent to the supporting statement banner
                sub = customContent.trim().split('\n')[0];
            }

            // Character details: Improved integration
            // If the primary object is clearly NOT a person (e.g. "robot", "car", "logo"), we might want to skip charDesc 
            // but for Style 1 the user often expects the character inputs to apply to the main subject if it's humanoid.
            const hasCharacterProps = characterGender || facialExpression || poseDescription || hairStyle || outfitDescription;
            const charDesc = hasCharacterProps
                ? `Specifically, the ${obj1} is a ${characterEthnicity || 'any'}-skinned ${characterGender || 'person'} with ${hairStyle || 'natural hair'}, wearing ${outfitDescription || 'stylish professional clothes'}. The facial expression is strictly "${facialExpression || 'confident'}" and the pose is "${poseDescription || 'standing'}".`
                : '';

            finalPrompt = `An ultra-HD marketing graphic in a ${styleLabel} style, characterized by a ${activeColor} color palette. The composition is ${composition}, centered around a conceptual theme of "${anchor}". Surface materials are defined by ${materials}, and the scene features ${lighting}. The top half features massive, clean, rounded white 3D letters in a bold Swiss-style font for the primary headline: '${head1}'. ${head2 ? `Below it, the secondary text '${head2}' is elegantly placed inside a glowing 3D pill shape with internal illumination.` : ''} A clean, translucent frosted glass banner displays the perfectly legible white text '${sub}'. In the foreground, a hyper-realistic high-detail 3D ${obj1} ${charDesc} is positioned next to a secondary complementary 3D ${obj2}, visually representing the core idea. Sophisticated lighting, sharp caustics, premium advertising aesthetic. 8k resolution, minimalist layout. White footer text: "${logo}".`;

            console.log("Style 1 Designer Expert Refined:", finalPrompt);
        } else if (style === 'style-4') {
            activeAspectRatio = '3:4';
            let contentSource = customContent
                ? `Custom Content: ${customContent}`
                : `Post Topic: ${topic}\nHeadline Hook: ${hook}`;

            const templatePrompt = `You are a world-class luxury art director. Perform a DEEP CONCEPTUAL ANALYSIS of the content to extract a sophisticated visual metaphor for a "Titan Elite" luxury brand.
            
            PROJECT: ${projectName || 'The Brand'}
            CONTENT: ${contentSource}
            
            Output JSON:
            {
              "SERIF_HEADLINE": "massive elegant serif headline (max 3 words)",
              "CONCEPTUAL_THEME": "a sophisticated visual metaphor (e.g. 'the weight of legacy', 'orbital precision')",
              "ACCENT_METAL": "gold, silver, bronze, or copper",
              "CORE_OBJECT": "A high-end 3D object representing the metahpor (e.g. floating platinum cube, obsidian orb)",
              "TAGLINE": "one refined sentence of copy summarizing the idea"
            }`;

            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: templatePrompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.6,
                },
            });

            const vars = JSON.parse(geminiResponse.text || '{}');

            const activeColor = color || 'obsidian black';
            let headline = (vars.SERIF_HEADLINE || '').toUpperCase();
            let labelTextVal = vars.MONO_LABEL || 'SYSTEM_ACTIVE';
            let tagline = vars.TAGLINE || '';
            let obj = vars.CORE_OBJECT || 'abstract luxury 3D object';
            let logo = projectName || 'The Brand';

            if (headlineText) headline = headlineText.toUpperCase();
            if (labelText) labelTextVal = labelText.toUpperCase();
            if (footerText) {
                tagline = footerText;
            } else if (headlineText && customContent) {
                tagline = customContent.trim().split('\n')[0];
            }
            if (logoText) logo = logoText;
            if (primaryObject) obj = primaryObject;

            // Character details for Style 4 (if provided)
            const hasCharacter = characterGender || facialExpression || poseDescription;
            const charDesc = hasCharacter
                ? `Specifically featuring a ${characterEthnicity || 'any'}-skinned ${characterGender || 'person'} with ${hairStyle || 'natural hair'}, wearing ${outfitDescription || 'luxury high-end fashion'}. Facial expression: strictly "${facialExpression || 'stoic and elite'}", pose: "${poseDescription || 'composed'}".`
                : '';

            finalPrompt = `A high-end luxury editorial poster themed around "${vars.CONCEPTUAL_THEME || 'elite excellence'}". The background is a deep matte ${activeColor}. Typography is massive, elegant, high-contrast white serif font reading "${headline}". Small monospace label "${vars.MONO_LABEL || 'TITAN_ELITE'}". Centered is a stunning, hyper-realistic 3D ${obj} ${charDesc} with ${vars.ACCENT_METAL || 'platinum'} accents. The lighting is cinematic low-key with sharp rim highlights. Bottom features a minimal white tagline "${tagline}". Brand: ${logo}.`;

            console.log("Style 4 Titan Elite Created:", finalPrompt);
        } else if (style === 'style-2') {
            activeAspectRatio = '3:4';
            let contentSource = customContent
                ? `Custom Content: ${customContent}`
                : `Post Topic: ${topic}\nHeadline Hook: ${hook}`;

            const templatePrompt = `You are a high-end 3D illustrator. Perform a DEEP ANALYSIS of the content to find its "human core" and "visual hook" for a modern startup poster.
            
            PROJECT: ${projectName || 'The Brand'}
            DETAILS: ${contentSource}
            BRAND COLOR: ${color || 'vivid purple'}

            Output ONLY a JSON object:
            {
              "CONCEPTUAL_HOOK": "the core human value or action mentioned in the text",
              "HEADLINE_TEXT": "catchy massive headline",
              "CHARACTER_GENDER": "${characterGender || 'male/female/non-binary'}",
              "CHARACTER_ETHNICITY": "${characterEthnicity || 'any'}",
              "HAIR_STYLE": "${hairStyle || 'style description'}",
              "OUTFIT_DESCRIPTION": "${outfitDescription || 'minimal tech clothing'}",
              "FACIAL_EXPRESSION": "${facialExpression || 'focused and confident'}",
              "POSE_DESCRIPTION": "${poseDescription || 'action/pose'}",
              "ACCESSORIES": "e.g. minimal glasses, smartwatch",
              "PRIMARY_OBJECT": "${primaryObject || 'main 3D tech object'}",
              "CTA_BUTTON_TEXT": "${ctaButtonText || 'short action text'}",
              "ACCENT_COLOR_HEX": "hex matching brand",
              "BACKGROUND_PRIMARY_HEX": "hex deep matching brand",
              "BACKGROUND_SECONDARY_HEX": "hex slightly lighter matching brand",
              "BUTTON_COLOR_HEX": "hex pop color",
              "LOGO_TEXT": "${logoText || projectName || 'The Brand'}",
              "BOTTOM_LEFT_TEXT": "${bottomLeftText || 'minimal sub-tag text'}",
              "RIBBON_STYLE": "dynamic swoosh ribbon"
            }`;

            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: templatePrompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                },
            });

            const cleanValue = (s: string) => {
                if (!s) return '';
                return s.replace(/[—\-_:*]/g, '').replace(/["'*]/g, '').trim();
            };

            const vars = JSON.parse(geminiResponse.text || '{}');

            let head = cleanValue(vars.HEADLINE_TEXT);
            let gen = cleanValue(vars.CHARACTER_GENDER);
            let eth = cleanValue(vars.CHARACTER_ETHNICITY);
            let hair = cleanValue(vars.HAIR_STYLE);
            let outfit = cleanValue(vars.OUTFIT_DESCRIPTION);
            let face = cleanValue(vars.FACIAL_EXPRESSION);
            let pose = cleanValue(vars.POSE_DESCRIPTION);
            let acc = cleanValue(vars.ACCESSORIES);
            let obj = cleanValue(vars.PRIMARY_OBJECT);
            let cta = cleanValue(vars.CTA_BUTTON_TEXT);
            const accHex = cleanValue(vars.ACCENT_COLOR_HEX);
            const bg1 = cleanValue(vars.BACKGROUND_PRIMARY_HEX);
            const bg2 = cleanValue(vars.BACKGROUND_SECONDARY_HEX);
            const btnHex = cleanValue(vars.BUTTON_COLOR_HEX);
            let logo = cleanValue(vars.LOGO_TEXT);
            let botLeft = cleanValue(vars.BOTTOM_LEFT_TEXT);
            const rib = cleanValue(vars.RIBBON_STYLE);

            // Hard overrides: user input ALWAYS beats AI extraction — no exceptions
            // Headline: use headlineText if set, else use customContent lines directly
            if (headlineText) {
                head = headlineText.trim();
            } else if (customContent) {
                const lines = customContent.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
                head = lines.join(' '); // join all lines as one headline
            }
            if (ctaButtonText) cta = ctaButtonText.trim();
            if (logoText) logo = logoText.trim();
            if (bottomLeftText) {
                botLeft = bottomLeftText.trim();
            } else if (headlineText && customContent) {
                // If headline is manual, use customContent for bottom sub-text
                botLeft = customContent.trim().split('\n')[0];
            }
            if (characterGender) gen = characterGender.trim();
            if (characterEthnicity) eth = characterEthnicity.trim();
            if (hairStyle) hair = hairStyle.trim();
            if (outfitDescription) outfit = outfitDescription.trim();
            if (facialExpression) face = facialExpression.trim();
            if (poseDescription) pose = poseDescription.trim();
            if (primaryObject) obj = primaryObject.trim();

            finalPrompt = `A high-quality 3D digital illustration themed around "${vars.CONCEPTUAL_HOOK || 'startup growth'}". Background is a smooth gradient using ${color || bg1} and ${bg2} with subtle grain texture. Large bold typography reads '${head}'. A ${eth}-skinned ${gen} with ${hair} hair, wearing ${outfit}, with a facial expression strictly "${face}", is ${pose} while interacting with a stylized 3D ${obj}. A large 3D button reading '${cta}' appears in ${btnHex}. A dynamic ${accHex} ${rib} wraps around the scene. Bottom left text reads '${botLeft}'. Bottom right shows '${logo}'. Energetic, modern, high resolution.`;

            console.log("Style 2 Corporate Memphis Refined:", finalPrompt);








        } else if (style === 'style-3') {
            let contentSource = customContent
                ? `Custom Content: ${customContent}`
                : `Post Topic: ${topic}\nHeadline Hook: ${hook}`;

            // Style 3 color intelligence: 2D3D hybrid — flat vivid BG + 3D subject popping out
            const s3ColorGuide = color
                ? `BRAND COLOR INPUT: "${color}"
Derive ALL colors from this single brand color:
- bg_color       → The brand color at FULL saturation, vivid and bold — NOT near-black (e.g. green → #2d7a32, blue → #1565c0, orange → #d45500, purple → #7b1fa2). This is a solid flat 2D background.
- accent_color   → A vivid complementary pop color with HIGH contrast against bg_color (e.g. bright yellow against green/purple, hot pink against teal, electric lime against navy).
- shape_color    → A lighter/translucent tone of bg_color for 2D geometric shapes and flat overlapping blocks.
- text_color     → Always pure white #ffffff.`
                : `No brand color specified. Use these defaults:
- bg_color     → #7b1fa2 (deep vivid purple)
- accent_color → #f5c800 (bright yellow)
- shape_color  → rgba(255,255,255,0.12)
- text_color   → #ffffff`;

            const templatePrompt = `You are a world-class art director. Perform a DEEP CONCEPTUAL ANALYSIS of the content to find its "visual metaphor" and "emotional core" for a modern 2D3D hybrid poster.
            
            ${s3ColorGuide}

            Output ONLY a JSON object:
            {
              "VISUAL_METAPHOR": "a strong visual metaphor for the idea (e.g. 'a golden key for access', 'rising digital stairs for progress')",
              "EMOTIONAL_CORE": "the core feeling of the piece (e.g. 'high-energy breakthrough', 'serene elite clarity')",
              "label": "short 2-3 word category label (e.g. GROWTH HACK, NEW LAUNCH)",
              "h1": "main bold headline — short punchy line 1",
              "h2": "headline continuation — line 2 (can be empty string if not needed)",
              "sub": "one short supporting subtext line",
              "CHARACTER_GENDER": "${characterGender || 'male/female/non-binary'}",
              "CHARACTER_ETHNICITY": "${characterEthnicity || 'any'}",
              "HAIR_STYLE": "${hairStyle || 'natural style'}",
              "OUTFIT_DESCRIPTION": "${outfitDescription || 'stylish casual outfit'}",
              "FACIAL_EXPRESSION": "${facialExpression || 'bold confident smile'}",
              "POSE_DESCRIPTION": "${poseDescription || 'standing forward-facing, arms open'}",
              "PRIMARY_OBJECT": "${primaryObject || 'relevant 3D prop or product'}",
              "CTA_TEXT": "${ctaButtonText || 'Get Started'}",
              "LOGO_TEXT": "${logoText || projectName || 'The Brand'}",
              "FOOTER_TEXT": "${footerText || 'tagline or website'}"
            }`;

            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: templatePrompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                },
            });

            const cleanValue = (s: string) => {
                if (!s) return '';
                return s.replace(/[—\-_:*]/g, '').replace(/^(TYPOGRAPHY|HEADLINE|LINE|TEXT|LABEL|PART|DESCRIPTION|BACKGROUND|SUBJECT|H1|H2|SUB)\s*\d*/gi, '').replace(/["'*]/g, '').trim();
            };

            const vars = JSON.parse(geminiResponse.text || '{}');

            // AI generates these — but user values ALWAYS win if provided
            let label = cleanValue(vars.label);
            let h1 = cleanValue(vars.h1);
            let h2 = cleanValue(vars.h2);
            let sub = cleanValue(vars.sub);

            let gen = cleanValue(vars.CHARACTER_GENDER);
            let eth = cleanValue(vars.CHARACTER_ETHNICITY);
            let hair = cleanValue(vars.HAIR_STYLE);
            let outfit = cleanValue(vars.OUTFIT_DESCRIPTION);
            let face = cleanValue(vars.FACIAL_EXPRESSION);
            let pose = cleanValue(vars.POSE_DESCRIPTION);
            let obj = cleanValue(vars.PRIMARY_OBJECT);
            let cta = cleanValue(vars.CTA_TEXT);
            const logo = cleanValue(vars.LOGO_TEXT);
            const footer = cleanValue(vars.FOOTER_TEXT);

            // Hard overrides: user input ALWAYS beats AI extraction — no exceptions
            if (headlineText) {
                h1 = headlineText.trim();
                h2 = '';
                // If headline is manual, map customContent to subtext
                if (customContent) sub = customContent.trim().split('\n')[0];
            } else if (customContent) {
                // User's typed idea text goes directly on the flyer — no AI rewriting
                const lines = customContent.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
                h1 = lines[0] || h1;
                h2 = lines[1] || '';
            }
            if (h2 === h1) h2 = '';
            if (ctaButtonText) cta = ctaButtonText.trim();
            if (labelText !== undefined) {
                label = (labelText.trim().toLowerCase() === 'none') ? '' : labelText.trim();
            }
            if (characterGender) gen = characterGender.trim();
            if (characterEthnicity) eth = characterEthnicity.trim();
            if (hairStyle) hair = hairStyle.trim();
            if (outfitDescription) outfit = outfitDescription.trim();
            if (facialExpression) face = facialExpression.trim();
            if (poseDescription) pose = poseDescription.trim();
            if (primaryObject) obj = primaryObject.trim();

            // Build label segment only if label is set
            const labelSegment = label
                ? `a thick rounded rectangle shape in a contrasting accent color containing the all - caps category label "${label}", `
                : '';

            // 2D3D hybrid: flat 2D layout elements + photorealistic 3D subject breaking the plane
            finalPrompt = `A bold 2D3D hybrid marketing poster themed around "${vars.VISUAL_METAPHOR || 'innovation'}". The background is a single flat solid ${color || 'vivid deep purple'} color capturing a "${vars.EMOTIONAL_CORE || 'dynamic breakthrough'}" mood. Overlaying the flat BG are bold 2D graphic design elements: ${labelSegment}massive clean sans-serif white flat typography reading "${h1}"${h2 ? ` then "${h2}"` : ''} stacked in large blocks, a thin flat horizontal rule as a divider, and small flat white text "${sub}". In the lower-center of the composition, a single hyper-realistic photorealistic 3D rendered character — specifically a ${eth}-skinned ${gen}, with ${hair} hair, wearing a ${outfit}, facial expression: ${face}, posed as: ${pose}, next to a 3D ${obj} — bursts forward out of the flat background. The 3D figure has full cinematic lighting and subsurface scattering. At the bottom: a flat 2D pill button with bold white text "${cta}", the logo text "${logo}" in clean sans-serif, and small footer text "${footer}". The result is a sharp contrast between the 2D layout and the photorealistic 3D character. 8K resolution.`;

            console.log("Style 3 2D3D Hybrid:", finalPrompt);



        }

        // Helper to delay execution
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        let imageBase64: string | null = null;
        let imageMime = 'image/jpeg';
        let attempts = 0;
        const maxAttempts = 2;

        // Prepare contents for generation
        let generationContents: any = `${finalPrompt} Aspect ratio: ${activeAspectRatio}.`;

        // If a reference image is provided, pass it to the generation model for grounding
        if (referenceImageUrl) {
            try {
                const imgRes = await fetch(referenceImageUrl);
                const buffer = await imgRes.arrayBuffer();
                const b64 = Buffer.from(buffer).toString('base64');
                const mime = imgRes.headers.get('content-type') || 'image/jpeg';

                generationContents = [
                    { text: generationContents },
                    { inlineData: { data: b64, mimeType: mime } }
                ];
            } catch (err) {
                console.error("[FlyerGen] Failed to fetch reference image for generation grounding:", err);
            }
        }

        while (attempts < maxAttempts) {
            try {
                // gemini-3.1-flash-image-preview is the correct model for image generation
                // Must use generateContent (NOT generateImages which hits the Imagen predict endpoint)
                const imgResponse = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image-preview',
                    contents: generationContents,
                });

                // Extract the image part from the response
                const parts = imgResponse?.candidates?.[0]?.content?.parts ?? [];
                for (const part of parts) {
                    if ((part as any).inlineData?.data) {
                        imageBase64 = (part as any).inlineData.data;
                        imageMime = (part as any).inlineData.mimeType || 'image/jpeg';
                        break;
                    }
                }

                if (!imageBase64) throw new Error('No image data in response parts.');
                break; // Success!
            } catch (err: any) {
                attempts++;
                const isRateLimit = err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED');

                if (isRateLimit && attempts < maxAttempts) {
                    console.log(`Rate limit hit(429).Retrying attempt ${attempts + 1}/${maxAttempts}...`);
                    await sleep(2000);
                    continue;
                }
                throw err;
            }
        }

        if (!imageBase64) {
            throw new Error('No image data returned from the model.');
        }

        return NextResponse.json({
            success: true,
            image: `data:${imageMime};base64,${imageBase64}`
        });

    } catch (error: any) {
        console.error("Flyer generation error:", error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate flyer image.' },
            { status: 500 }
        );
    }
}

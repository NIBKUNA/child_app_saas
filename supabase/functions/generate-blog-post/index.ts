// @ts-nocheck
// Note: These imports use Deno's import map configured in deno.json
// The URLs below match the mappings defined in supabase/functions/deno.json
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

// Declare Deno for TypeScript if environment not configured
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ✨ 주소에서 지역 정보 추출 (예: "서울시 강남구 대치동 123-45" → { city: "서울시", district: "강남구", dong: "대치동" })
function parseAddress(address: string): { city: string; district: string; dong: string } {
    const parts = address.split(/\s+/);
    return {
        city: parts[0] || '서울시',
        district: parts[1] || '',
        dong: parts[2] || ''
    };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Function Invoked");

        // 1. Init Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseKey) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            throw new Error("Missing Server Configuration");
        }

        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        // 2. Fetch Context (Admin Settings)
        const { data: settings, error: settingsError } = await supabaseClient.from('admin_settings').select('*');
        if (settingsError) console.error("Settings Fetch Error:", settingsError);

        const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || '';

        // ✨ [Local SEO] Fetch Center Info from 'centers' table
        const { data: centerData, error: centerError } = await supabaseClient
            .from('centers')
            .select('name, address, phone')
            .limit(1)
            .single();

        if (centerError) console.error("Center Fetch Error:", centerError);

        const centerName = centerData?.name || getSetting('center_name') || '아동발달센터';
        const centerAddress = centerData?.address || getSetting('center_address') || '서울시 강남구 역삼동';
        const centerPhone = centerData?.phone || getSetting('center_phone') || '';

        // ✨ 주소 파싱하여 지역 키워드 추출
        const location = parseAddress(centerAddress);
        const locationKeywords = {
            specific: `${location.dong} ${location.district}`, // 예: "대치동 강남구"
            broad: `${location.district} ${location.city}`,    // 예: "강남구 서울시"
            district: location.district,                        // 예: "강남구"
            dong: location.dong                                 // 예: "대치동"
        };

        console.log("Location Keywords:", locationKeywords);

        const programsRaw = getSetting('programs_list');

        let programsList = "언어치료, 놀이치료, 감각통합";
        try {
            if (programsRaw) {
                const parsed = JSON.parse(programsRaw);
                programsList = parsed.map((p: any) => p.title).join(', ');
            }
        } catch (e) { }

        // ✨ [Duplicate Content Shield] 최근 10개 포스트 제목 가져오기
        console.log("Fetching recent blog titles for duplicate prevention...");
        const { data: recentPosts } = await supabaseClient
            .from('blog_posts')
            .select('title')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentTitles = recentPosts?.map((p: any) => p.title) || [];
        const recentTitlesStr = recentTitles.length > 0
            ? recentTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')
            : '(아직 작성된 포스트가 없습니다)';

        console.log("Recent titles for duplicate prevention:", recentTitles.length);

        // 3. Define Persona & Prompt
        const topics = [
            "말이 늦은 아이를 위한 가정 지도 꿀팁",
            "초등학교 입학 전 꼭 체크해야 할 사회성 발달",
            "떼쓰는 아이, 어떻게 훈육해야 할까요?",
            "놀이치료가 정말 효과가 있을까요?",
            "집에서 아이와 함께하는 감각통합 놀이",
            "우리아이 자존감 높여주는 대화법",
            "스마트폰만 보는 우리 아이, 괜찮을까요?",
            "형제 자매 싸움, 부모의 현명한 중재법",
            "감정 조절이 어려운 아이, 부모가 도와줄 수 있는 방법",
            "아이의 집중력 향상을 위한 일상 속 놀이",
            "형/동생이 생겼을 때 첫째 아이 마음 챙기기",
            "등원 거부하는 아이, 어떻게 대처할까요?"
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        // ✨ [Local SEO Enhanced] 지역 키워드를 포함한 시스템 프롬프트
        const systemPrompt = `
You are the "Center Chief" (센터장님) of a warm, professional Child Development Center named "${centerName}".
Your center is located in ${centerAddress} (${location.district}, ${location.dong}).
Your tone is empathetic, encouraging, and professional yet accessible (friendly Korean).
You write blog posts to help parents who are worried about their children's development.

🚫 **CRITICAL: Duplicate Content Prevention (중복 방지)**
Here are the titles of recent blog posts. DO NOT write about the exact same topics.
Choose a different angle, a more specific sub-topic, or a new category to ensure content variety.

Recent Posts:
${recentTitlesStr}

If the suggested topic is too similar to any of the above, modify it to be unique (e.g., add a specific age group, a different symptom, or a new activity type).

🌍 **CRITICAL: Local SEO Requirements**
- You MUST naturally include location keywords in the content for local search optimization.
- Use these location keyword variations naturally in the title, content, and meta tags:
  * Specific: "${locationKeywords.dong} 언어치료", "${locationKeywords.dong} 아동발달센터"
  * Broad: "${locationKeywords.district} 언어발달", "${locationKeywords.district} 놀이치료"
  * Natural mentions: "저희 ${locationKeywords.district}에 위치한 센터에서는...", "${locationKeywords.dong}의 부모님들이..."
- Do NOT force keywords unnaturally. Weave them into the narrative.

Style Guidelines:
- **Tone**: Professional, sophisticated, yet warm and accessible. Think "Premium Lifestyle Magazine" column.
- **NO EMOJIS**: Do NOT use decorative emojis in the body text. Keep it clean and readable.
- **NO HASHTAGS**: Do NOT use hashtags (e.g., #SongpaChildCenter) anywhere in the post.
- **Natural Keywords**: Do NOT use unnatural keywords like 'Songpa-gu Play Therapy' repeatedly. Instead, weave the location (Songpa-gu, Seokchonhosu-ro) naturally into the story (e.g., "Walking near Seokchon Lake, I thought about...").
- **Persona**: The tone must be the "Center Chief" (센터장님) - warm, professional, authentic, and empathetic. Focus on the parent's feelings and the child's perspective.
- **Addressing Concerns**: Address parents' concerns directly in sub-headlines.
- **Typography and Emphasis**: Use bold text for emphasis sparingly, only for truly key insights.
- **Paragraph Structure**: Paragraphs should be concise to avoid text walls. Use clear <h2> subheadings. Avoid excessive bullet points.
- **Formatting**: Use <blockquote> for key takeaways or important quotes instead of bold lists.
- **Flow**: Smooth, logical transitions. Avoid robotic "First, Second, Lastly".

Structure Requirements:
1. **Title**: Catchy but professional (e.g., "우리 아이 언어 발달, 놓치지 말아야 할 신호들").
2. **Intro**: Set the scene comfortably.
3. **Body**: 3-4 sections with clear <h2> headers. Deep dive into the topic.
4. **Key Takeaway**: Use a <blockquote> tag for the most important message.
5. **Conclusion**: Warm encouragement.
6. **Center Formatting**: Mention "${centerName}" naturally (e.g., "${locationKeywords.district}에 위치한 저희 센터에서는...").

⚖️ **CRITICAL: South Korean Medical Law Compliance (의료법 준수)**
This is NON-NEGOTIABLE. You MUST follow these rules strictly:

🚫 **FORBIDDEN Vocabulary (절대 사용 금지):**
- "치료" (Cure/Treatment) - ONLY allowed in certified category names like "언어치료", "놀이치료", "음악치료"
- "진단" (Diagnosis) - You are NOT a doctor
- "처방" (Prescription) - You cannot prescribe anything
- "완치" (Complete cure) - Never promise this
- "부작용 없음" (No side effects) - Cannot guarantee
- "최고", "최단기", "100%" - No superlatives or guarantees

✅ **RECOMMENDED Vocabulary (권장 용어):**
- "중재" (Intervention) instead of "치료" when referring to general support
- "수업", "프로그램", "세션" instead of "치료" when describing activities
- "상담", "평가" instead of "진단"
- "개선", "도움", "발달 지원" instead of cure-related words
- "~에 도움이 될 수 있습니다" (May help with) instead of guarantees

📜 **Mandatory Disclaimer:**
You MUST end every blog post content with this exact disclaimer in HTML:
<div class="disclaimer"><p><strong>📋 안내:</strong> 본 포스팅은 정보 제공을 목적으로 하며, 정확한 아이의 상태 확인은 전문가와의 개별 상담 및 평가가 필요합니다. 의료적 조언을 대체하지 않습니다.</p></div>

🔍 **Self-Validation:**
Before finalizing, review your content:
1. Did I use any forbidden words outside of certified therapy names?
2. Did I promise any guaranteed results or timeframes?
3. Did I include the mandatory disclaimer?
4. Is my tone supportive but NOT making medical claims?

Format the output as a valid JSON object (no markdown code fences) with these fields:
- "title": A catchy, click-worthy Korean title (INCLUDE location keyword like "${locationKeywords.district}" when natural).
- "slug": A URL-friendly English slug (kebab-case, include location like "gangnam-speech-therapy").
- "excerpt": A 2-sentence summary hook.
- "content": The full blog post content in HTML format. Use <h2> for section headers. Use <blockquote> for key insights. Use <b> for emphasis. Do NOT include <h1> or title in content. MUST end with the disclaimer div.
- "seo_title": SEO optimized title (under 60 chars, MUST include "${locationKeywords.district}" or "${locationKeywords.dong}").
- "seo_description": SEO meta description (under 150 chars, include location naturally).
- "keywords": CSV string of 5-7 keywords (MUST include location variations like "${locationKeywords.dong} 언어치료", "${locationKeywords.district} 아동발달").
- "image_query": A short English description to search for a stock photo (e.g., "mother playing with child blocks").
- "geo_location": JSON object with { "city": "${location.city}", "district": "${location.district}", "dong": "${location.dong}", "full_address": "${centerAddress}" }
- "compliance_check": Boolean true if the content passes all medical law compliance checks.
`;

        const userPrompt = `Write a blog post about: "${randomTopic}".
    The center offers these programs: ${programsList}.
    Target Audience: Parents of children aged 3-10 in ${location.district} area.
    Location: ${centerAddress}
    
    IMPORTANT: Ensure medical law compliance. Use "중재", "수업", "발달 지원" vocabulary. Include the mandatory disclaimer at the end.`;

        // 4. Call Google Gemini API (via SDK)
        const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_KEY');
        if (!GEMINI_API_KEY) {
            console.error("Missing GOOGLE_AI_KEY");
            throw new Error('Missing GOOGLE_AI_KEY environment variable');
        }

        console.log("Initializing Gemini SDK...");

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Using gemini-flash-latest to avoid quota issues with 2.0 preview
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        console.log("Generating Content with gemini-flash-latest...");

        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
        const response = result.response;
        const generatedText = response.text();

        if (!generatedText) {
            console.error("Gemini returned no content");
            throw new Error('No content generated from Gemini');
        }

        let generatedPost;
        try {
            generatedPost = JSON.parse(generatedText);
        } catch (e) {
            // Fallback cleanup if formatted partially
            const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '');
            generatedPost = JSON.parse(cleanJson);
        }

        // ✨ [Compliance Post-Processing] 의료법 준수 후처리
        console.log("Running Compliance Post-Processing...");

        // 5a. Ensure disclaimer is present at the end of content
        const mandatoryDisclaimer = '<div class="disclaimer" style="margin-top: 2rem; padding: 1rem; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0.5rem;"><p style="margin: 0; font-size: 0.875rem; color: #475569;"><strong>📋 안내:</strong> 본 포스팅은 정보 제공을 목적으로 하며, 정확한 아이의 상태 확인은 전문가와의 개별 상담 및 평가가 필요합니다. 의료적 조언을 대체하지 않습니다.</p></div>';

        if (!generatedPost.content.includes('disclaimer')) {
            generatedPost.content = generatedPost.content + mandatoryDisclaimer;
            console.log("Appended mandatory disclaimer");
        }

        // 5b. Vocabulary compliance check (forbidden words outside of therapy names)
        const forbiddenPatterns = [
            /(?<!언어|놀이|음악|미술|인지)치료(?!사|실)/g,  // "치료" not preceded by therapy types
            /진단을?\s*(합니다|해드립니다|내립니다)/g,     // Making diagnosis claims
            /처방/g,                                        // Prescription
            /완치/g,                                        // Complete cure
            /100%/g,                                        // 100% guarantees
            /부작용\s*없(음|습니다)/g                       // No side effects claims
        ];

        let complianceWarnings: string[] = [];
        forbiddenPatterns.forEach((pattern, idx) => {
            if (pattern.test(generatedPost.content)) {
                complianceWarnings.push(`Pattern ${idx} found`);
            }
        });

        if (complianceWarnings.length > 0) {
            console.warn("Compliance warnings:", complianceWarnings);
            // Still proceed but log the warning
        }

        // 5c. ✨ [Unique Image Selection] 중복 이미지 방지
        const imagePool = [
            "https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&w=1600&q=80", // ✨ [NEW] High Quality Hero
            "https://images.unsplash.com/photo-1587653263995-422546a72569?auto=format&fit=crop&w=1600&q=80", // ✨ [NEW] Story Image
            "https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&w=1600&q=80", // ✨ [NEW] Reading
            "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=80", // child with blocks
            "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1600&q=80", // child playing
            "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80", // children classroom
            "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=1600&q=80", // parent hugging child
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80", // kids outdoor
            "https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&w=1600&q=80", // child drawing
            "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80", // baby toys
            "https://images.unsplash.com/photo-1534982741079-82e0ae40ef89?auto=format&fit=crop&w=1600&q=80"  // parent teaching
        ];

        // 최근 10개 포스트의 이미지 URL 가져오기 (Strict Exclusion Logic)
        const { data: recentImages } = await supabaseClient
            .from('blog_posts')
            .select('cover_image_url')
            .order('created_at', { ascending: false })
            .limit(10); // ✨ Check last 10 posts

        // Normalize URL helper (remove query params for comparison)
        const normalizeUrl = (url: string) => url ? url.split('?')[0] : '';

        const usedImageUrls = new Set(recentImages?.map((p: any) => normalizeUrl(p.cover_image_url)) || []);

        // 사용하지 않은 이미지 중에서 랜덤 선택 (Normalize pool images too)
        // 사용하지 않은 이미지 중에서 랜덤 선택 (Normalize pool images too)
        const availableImages = imagePool.filter(url => !usedImageUrls.has(normalizeUrl(url)));

        let selectedImage = "";
        if (availableImages.length > 0) {
            selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
        } else {
            console.log("⚠️ [EMERGENCY] Image Pool Exhausted! Resetting pool usage.");
            // If all used, pick RANDOM from entire pool (ignore history)
            selectedImage = imagePool[Math.floor(Math.random() * imagePool.length)];
        }

        console.log("Previously used:", [...usedImageUrls]);
        console.log("Selected new:", selectedImage);

        // ✨ [Content Cleanup] Remove Emojis and Icons strictly
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2B05}-\u{2B07}\u{2190}-\u{2195}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FC}\u{25FB}\u{25FA}\u{25F0}-\u{25F3}\u{25E2}-\u{25E5}\u{25D0}-\u{25D5}\u{25C0}-\u{25C4}\u{25B2}-\u{25B5}\u{25A0}-\u{25A3}\u{203C}\u{2049}]/gu;

        const cleanContent = generatedPost.content.replace(emojiRegex, '');
        const cleanExcerpt = generatedPost.excerpt.replace(emojiRegex, '');

        console.log("Inserting Blog Post:", generatedPost.title);

        const { data: post, error: dbError } = await supabaseClient.from('blog_posts').insert({
            title: generatedPost.title,
            slug: `${generatedPost.slug}-${Date.now()}`,
            excerpt: cleanExcerpt,
            content: cleanContent, // ✨ Cleaned content
            cover_image_url: selectedImage,
            seo_title: generatedPost.seo_title,
            seo_description: generatedPost.seo_description,
            keywords: generatedPost.keywords.split(',').map((s: string) => s.trim()),
            is_published: true,
            published_at: new Date().toISOString(),
            view_count: 0
        }).select().single();

        if (dbError) {
            console.error("DB Insert Failed:", dbError);
            throw dbError;
        }

        console.log("Blog Post Created ID:", post.id);

        return new Response(JSON.stringify({ success: true, post }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error("Function Handler Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

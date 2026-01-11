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

// ✨ [Privacy-First] 주소에서 시/구/동만 추출 (도로명, 지번 완전 제외)
// 예: "서울시 송파구 석촌동 12길 34-5" → { city: "서울시", district: "송파구", dong: "석촌동" }
function parseAddress(address: string): { city: string; district: string; dong: string } {
    // 도로명/지번 패턴 제거 (숫자, 길, 로, 번지 등)
    const cleanAddress = address.replace(/\d+[가-힣]*길|\d+[가-힣]*로|\d+-?\d*|번지|호/g, '').trim();
    const parts = cleanAddress.split(/\s+/).filter(p => p.length > 0);

    // 시/도, 구/군, 동/읍/면 단위만 추출
    let city = '', district = '', dong = '';
    for (const part of parts) {
        if (/시$|도$/.test(part) && !city) city = part;
        else if (/구$|군$/.test(part) && !district) district = part;
        else if (/동$|읍$|면$/.test(part) && !dong) dong = part;
    }

    return {
        city: city || '서울시',
        district: district || '',
        dong: dong || ''
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

        // ✨ [Human-Centric AI Engine] P.A.S. Framework + Privacy-First SEO
        const systemPrompt = `
당신은 "${centerName}"의 센터장입니다.
${location.district} ${location.dong} 지역의 부모님들을 위해 진심 어린 블로그 글을 작성합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 P.A.S. FRAMEWORK (핵심 구조)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **HOOK (도입)**: 기계적인 인사 금지!
   - "안녕하세요, 센터장입니다" ❌
   - "아이와 행복한 하루, 잘 보내고 계신가요?" ✓
   - "혹시 요즘 아이가 자꾸 떼를 쓰나요?" ✓
   - 부모님의 고민을 꿰뚫는 질문이나 공감으로 시작하세요.

2. **PROBLEM & AGITATION (문제 공감)**:
   - 단순 정보 나열 금지! 부모님의 불안과 갈등에 깊이 공감하세요.
   - "다른 집 아이는 잘하는데..."라는 비교 심리를 이해해 주세요.
   - 그 후, 전문가의 시선에서 근본 원인을 따뜻하게 짚어주세요.

3. **SOLUTION (해결책)**:
   - 명확하고 실천 가능한 팁 3-5개를 제시하세요.
   - 각 팁에는 "왜 이게 효과적인지" 이유를 짧게 덧붙이세요.
   - 센터장으로서의 따뜻한 통찰을 더하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 시각적 가독성 (Visual Rhythm)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **호흡 조절**: 한 단락은 반드시 **1~2문장**으로 제한하세요.
• **단락 사이**: <br/><br/>를 사용하여 시원하게 띄우세요.
• **강조**: 핵심 문구는 <strong> 태그 사용 (섹션당 1회만).
• **울림 문구**: 가슴에 남는 말은 <blockquote>로 감싸세요.
• **분절화**: 복잡한 설명은 **• 글머리 기호**나 번호 목록을 사용하세요.

예시:
<p>아이가 말을 시작하는 시기는 정말 다양하거든요.</p>
<br/><br/>
<p>어떤 아이는 12개월에, 어떤 아이는 24개월이 지나서야 첫 단어를 말하기도 해요.</p>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️ 페르소나 및 화법 (Warm Expert)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **어미 처리**: 딱딱한 평어체(~이다, ~한다) 금지!
  - 부드러운 구어체 사용: ~거든요, ~일까요?, ~해 보세요, ~하시면 좋아요
  - 예: "아이의 마음이 편안해지거든요." / "한번 시도해 보시겠어요?"

• **인간미**: 문장 길이에 변화를 주어 리듬감을 살리세요.
  - 짧은 문장 → 긴 문장 → 짧은 문장

• **금지 사항**:
  - 이모지 사용 금지
  - 해시태그 금지
  - "안녕하세요, OO센터장입니다" 같은 기계적 인사 금지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 로컬 SEO (Privacy-First)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **키워드 절제**: 지역 키워드(${location.district}, ${location.dong})는 전체 글에서 **최대 2회만** 사용하세요.
• **상세 주소 절대 금지**: 도로명, 번지, 건물명 언급하지 마세요.
• **자연스러운 맥락**: 일상 대화처럼 녹여내세요.
  - ✓ "우리 ${location.district} 어머님들께서 많이 물어보시는..."
  - ✓ "${location.dong}에도 봄바람이 불어오는 요즘..."
  - ✗ "${location.district} ${location.dong} 언어치료 센터를 찾으신다면..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ 의료법 준수 (Compliance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **금지 단어**: '치료'(공식 명칭 제외), '진단', '처방', '완치', '100%', '부작용 없음'
• **대체 표현**:
  - 치료 → '발달 지원', '중재', '함께하는 활동', '수업'
  - 진단 → '평가', '상담', '발달 확인'

• **필수 면책 조항** (글 하단에 반드시 포함):
<div style="margin-top: 2.5rem; padding: 1.25rem; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #3b82f6; border-radius: 0.75rem;">
  <p style="margin: 0; font-size: 0.875rem; color: #475569; line-height: 1.6;">
    <strong>📋 안내</strong><br/>
    본 포스팅은 정보 제공을 목적으로 하며, 정확한 발달 상태 확인은 전문가와의 개별 상담이 필요합니다. 의료적 조언을 대체하지 않습니다.
  </p>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 중복 방지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

최근 작성된 글 목록:
${recentTitlesStr}

위 주제와 유사한 내용은 피하고, 새로운 각도나 구체적인 연령대/상황을 추가하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 OUTPUT FORMAT (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "title": "[제목 - 지역 키워드 자연스럽게 포함 가능]",
  "slug": "[url-friendly-slug]",
  "excerpt": "[2-3문장 요약, 부모님의 마음을 울리는 문구]",
  "content": "[HTML 본문 - 위 가이드라인 준수, 면책조항 포함]",
  "seo_title": "[SEO 최적화 제목 | ${centerName}]",
  "seo_description": "[155자 이내 메타 설명]",
  "keywords": "[쉼표로 구분된 키워드 5-7개]",
  "image_query": "[Unsplash 검색어 - 아이/가족/발달 관련]",
  "geo_location": "${location.district} ${location.dong}",
  "compliance_check": true
}
`;

        const userPrompt = `주제: "${randomTopic}"
센터 프로그램: ${programsList}
대상 독자: ${location.district} 지역 부모님

위 시스템 프롬프트의 P.A.S. 구조와 시각적 가독성 규칙을 철저히 준수하여 블로그 글을 작성하세요.

특히 중요:
1. 훅으로 시작 (기계적 인사 금지)
2. 1-2문장 단락 + <br/><br/> 간격
3. 부드러운 구어체 (~거든요, ~해 보세요)
4. 지역 키워드 최대 2회만 사용
5. 면책 조항 필수 포함

JSON 형식으로 출력하세요.`;

        // 4. Call Google Gemini API (via SDK)
        const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_KEY');
        if (!GEMINI_API_KEY) {
            console.error("Missing GOOGLE_AI_KEY");
            throw new Error('Missing GOOGLE_AI_KEY environment variable');
        }

        console.log("Initializing Gemini SDK...");

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Using gemini-2.0-flash for stable production use
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        console.log("Generating Content with gemini-2.0-flash...");

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

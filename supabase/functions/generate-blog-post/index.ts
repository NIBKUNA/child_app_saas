// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno for TypeScript environment
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // 1. CORS 처리
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const requestData = await req.json().catch(() => ({}));
        const { topic, keyword, center_name, region, openai_api_key } = requestData;

        // ✨ [Critical Fix] 사용자가 입력한 OpenAI API KEY 사용
        const apiKey = openai_api_key;

        if (!apiKey) {
            console.error("Missing API Key");
            return new Response(
                JSON.stringify({ error: "OpenAI API 키가 설정되지 않았습니다. 관리자 페이지에서 키를 입력해주세요." }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const subject = topic || keyword || '아동 발달';
        console.log(`[Start] Generating blog post for subject: ${subject} using OpenAI`);

        // 프롬프트 준비
        const systemPrompt = `당신은 ${region || '지역'}에서 20년 이상 아동 발달 센터를 운영해온 베테랑 원장님입니다. 걱정하는 부모님을 안심시키고, 신뢰감 있는 조언을 주는 따뜻한 톤앤매너로 블로그 글을 작성해주세요.`;

        const userPrompt = `
            [글 작성 정보]
            - 주제: ${subject}
            - 키워드: ${keyword || subject}
            - 타겟 독자: ${region || '지역'} 센터를 찾고 있는 30-40대 부모님
            - 센터 이름: ${center_name || '자라다 아동발달센터'}
            - 지역: ${region || '지역'}

            [필수 준수 사항]
            1. **제목 포맷**: 반드시 "${region || '지역'} ${keyword || subject}"를 포함한 매력적인 제목으로 시작.
            2. **의료법 준수**: '완치', '100% 개선', '무조건' 표현 절대 금지. "도움이 될 수 있습니다" 등 완곡한 표현 사용.
            3. **형식**: Markdown (H2, H3, Bold) 사용. 문단은 짧게.
            4. **구조**:
               - [공감]: 부모님 걱정에 공감
               - [정보]: 전문적 설명 및 해결 방안 (3가지)
               - [안심]: 센터 철학 및 희망적 메시지
               - [하단바]: 센터 정보 및 문의처 포함
        `;

        // OpenAI API 호출 (GPT-4o-mini 사용, 가성비 최적)
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // or 'gpt-3.5-turbo'
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[OpenAI Error]", errorData);

            // 429 에러 처리
            if (response.status === 429) {
                return new Response(
                    JSON.stringify({
                        error: "OpenAI 이용 한도 초과(429). 결제 수단을 등록했는지 확인해주세요.",
                        details: errorData
                    }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            throw new Error(errorData.error?.message || `OpenAI API Error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            throw new Error("생성된 텍스트가 없습니다.");
        }

        return new Response(
            JSON.stringify({ post: generatedText, usedModel: 'gpt-4o-mini' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
})

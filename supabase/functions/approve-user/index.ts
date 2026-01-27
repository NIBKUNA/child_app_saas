import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. 요청자(관리자) 확인
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) throw new Error('No user found')

        // 2. 관리자 권한 체크 (user_profiles 조회)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: adminProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
            throw new Error('Unauthorized: 관리자 권한이 필요합니다.')
        }

        // 3. 대상 유저 ID 받기
        const { target_user_id } = await req.json()
        if (!target_user_id) throw new Error('Target user ID is required')

        // 4. 승인 처리 (Service Role 사용 -> RLS 우회)
        const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({ role: 'therapist', status: 'active' })
            .eq('id', target_user_id)

        if (updateError) throw updateError

        // Therapists 테이블도 업데이트 (선택)
        await supabaseAdmin
            .from('therapists')
            .update({ color: '#3b82f6' })
            .eq('id', target_user_id)

        return new Response(
            JSON.stringify({ success: true, message: '승인되었습니다.' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

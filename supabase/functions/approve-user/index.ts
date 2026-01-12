import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
        // 여기서는 Service Role Key를 사용하지 않고도 읽기는 가능해야 함 (보통)
        // 하지만 확실하게 하기 위해 Service Role 클라이언트를 따로 만듦
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

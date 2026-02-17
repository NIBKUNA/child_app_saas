-- 🏗️ [ZARADA SAAS] FINAL SECURITY & AUTO-PROVISIONING SYSTEM
-- Description: 1. Storage RLS (Folder-based multi-tenancy)
--              2. Auto-Profile Trigger (Prevents OAuth Ghost Profiles)
--              3. Data Integrity Constraints

-- 1. [STORAGE RLS] Multi-tenant Folder Isolation
-- This ensures center A cannot read/write to center B's folder.
-- Folder structure: [bucket]/[center_id]/file.webp

-- Cleanup existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "center_storage_isolation_select" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_insert" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_update" ON storage.objects;
DROP POLICY IF EXISTS "center_storage_isolation_delete" ON storage.objects;

-- Create policies on storage.objects
CREATE POLICY "center_storage_isolation_select" ON storage.objects FOR SELECT TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_update" ON storage.objects FOR UPDATE TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);

CREATE POLICY "center_storage_isolation_delete" ON storage.objects FOR DELETE TO authenticated
USING (
    (storage.foldername(name))[1] = (SELECT center_id::text FROM public.user_profiles WHERE id = auth.uid())
    OR public.is_super_admin()
);


-- 2. [AUTO-PROFILE] Automatically create profile for any new Auth user
-- This solves the "Ghost User" problem for OAuth (Google/Kakao) logins.
-- ✨ [SaaS V2] center_id & role을 메타데이터에서 읽어 정확한 센터 배정 보장
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_center_id UUID;
  v_name TEXT;
BEGIN
  -- 메타데이터에서 역할과 센터 ID 추출
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
  v_center_id := (NEW.raw_user_meta_data->>'center_id')::UUID;
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Member');

  -- 1. user_profiles 생성 (center_id 포함!)
  INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    v_name,
    v_role,
    v_center_id,
    'active' -- 이메일 가입은 즉시 활성화 (승인 필요 시 'pending'으로 변경)
  )
  ON CONFLICT (id) DO UPDATE SET
    center_id = COALESCE(public.user_profiles.center_id, EXCLUDED.center_id),
    role = COALESCE(NULLIF(public.user_profiles.role, 'parent'), EXCLUDED.role);

  -- 2. 부모(parent) 역할이면 parents 테이블에도 자동 생성
  --    → 초대 코드(connect_child_with_code)가 parent_id를 참조하므로 필수
  IF v_role = 'parent' AND v_center_id IS NOT NULL THEN
    INSERT INTO public.parents (profile_id, center_id, name, email)
    VALUES (NEW.id, v_center_id, v_name, NEW.email)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- 3. [DATA INTEGRITY] Ensure no record is orphaned without center_id
-- We add check constraints only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'children' AND constraint_name = 'children_center_id_check') THEN
        ALTER TABLE public.children ADD CONSTRAINT children_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'therapists' AND constraint_name = 'therapists_center_id_check') THEN
        ALTER TABLE public.therapists ADD CONSTRAINT therapists_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'schedules' AND constraint_name = 'schedules_center_id_check') THEN
        ALTER TABLE public.schedules ADD CONSTRAINT schedules_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'consultations' AND constraint_name = 'consultations_center_id_check') THEN
        ALTER TABLE public.consultations ADD CONSTRAINT consultations_center_id_check CHECK (center_id IS NOT NULL);
    END IF;
END $$;


-- ✅ 시스템 최적화 및 보안 강화 완료
DO $$ BEGIN RAISE NOTICE '🏆 Zarada SaaS Ultimate Security & Auto-Provisioning Deployed.'; END $$;

-- 🔧 [SCHEMA FIX] Add Missing Role Columns to Therapists Table
-- "Pending Staff"의 권한이 저장되지 않는 문제를 해결합니다.

BEGIN;

-- 1. Add 'system_role' if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'system_role') THEN
        ALTER TABLE public.therapists ADD COLUMN system_role text DEFAULT 'therapist';
    END IF;
END $$;

-- 2. Add 'system_status' if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapists' AND column_name = 'system_status') THEN
        ALTER TABLE public.therapists ADD COLUMN system_status text DEFAULT 'active';
    END IF;
END $$;

-- 3. (Optional) Sync existing data
-- 이미 등록된 'center director' 같은 사람들을 위해 예시 업데이트 (실제로는 UI에서 다시 저장해야 함)
-- UPDATE public.therapists SET system_role = 'admin' WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ Therapists Table Schema Updated.'; END $$;

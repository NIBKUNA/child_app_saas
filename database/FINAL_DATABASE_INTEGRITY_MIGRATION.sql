-- 🎨 Zarada ERP Database Schema Final Integrity Fix
-- -----------------------------------------------------------
-- 🛠️ Created by: Antigravity
-- 📅 Date: 2026-01-28
-- 🖋️ Description: "Fixing missing columns in children and therapists tables"

-- 1. FIX 'children' TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='guardian_name') THEN
        ALTER TABLE public.children ADD COLUMN guardian_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='contact') THEN
        ALTER TABLE public.children ADD COLUMN contact VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='registration_number') THEN
        ALTER TABLE public.children ADD COLUMN registration_number VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='invitation_code') THEN
        ALTER TABLE public.children ADD COLUMN invitation_code VARCHAR(5) UNIQUE;
    END IF;
END $$;

-- 2. FIX 'therapists' TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='system_role') THEN
        ALTER TABLE public.therapists ADD COLUMN system_role VARCHAR(20) DEFAULT 'therapist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='system_status') THEN
        ALTER TABLE public.therapists ADD COLUMN system_status VARCHAR(20) DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='hire_type') THEN
        ALTER TABLE public.therapists ADD COLUMN hire_type VARCHAR(20) DEFAULT 'freelancer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='bank_name') THEN
        ALTER TABLE public.therapists ADD COLUMN bank_name VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='account_number') THEN
        ALTER TABLE public.therapists ADD COLUMN account_number VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='account_holder') THEN
        ALTER TABLE public.therapists ADD COLUMN account_holder VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='career') THEN
        ALTER TABLE public.therapists ADD COLUMN career TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='specialties') THEN
        ALTER TABLE public.therapists ADD COLUMN specialties TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='profile_image') THEN
        ALTER TABLE public.therapists ADD COLUMN profile_image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='website_visible') THEN
        ALTER TABLE public.therapists ADD COLUMN website_visible BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Ensure invitation code generator exists
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_code VARCHAR(5);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 5));
        SELECT EXISTS (SELECT 1 FROM public.children WHERE invitation_code = new_code) INTO code_exists;
        IF NOT code_exists THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.auto_generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := public.generate_invitation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_invitation_code_trigger ON public.children;
CREATE TRIGGER auto_invitation_code_trigger
    BEFORE INSERT ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_invitation_code();

-- 4. Reload Schema cache
NOTIFY pgrst, 'reload schema';

-- 🎨 Zarada ERP Child Schema Fix
-- -----------------------------------------------------------
-- 🛠️ Created by: Antigravity
-- 📅 Date: 2026-01-28
-- 🖋️ Description: "Missing columns in children table"

-- 1. Add missing columns to 'children' table
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
END $$;

-- 2. Verify or add invitation_code (if consolidated fix wasn't run)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='invitation_code') THEN
        ALTER TABLE public.children ADD COLUMN invitation_code VARCHAR(5) UNIQUE;
    END IF;
END $$;

-- 3. Ensure the auto-generator for invitation_code exists
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

-- 🎨 Zarada ERP User Registration Trigger Final Fix
-- -----------------------------------------------------------
-- 🛠️ Created by: Antigravity
-- 📅 Date: 2026-01-28
-- 🖋️ Description: "Ensure all user types (Admin, Therapist, Parent) are handled correctly"

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_status TEXT := 'pending';
  v_is_pre_registered BOOLEAN := false;
  v_center_id UUID;
BEGIN
  -- 1. Extract metadata
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'parent');
  v_center_id := (new.raw_user_meta_data->>'center_id')::UUID;
  
  -- 2. Check if pre-registered staff (Already in therapists table)
  SELECT EXISTS (
    SELECT 1 FROM public.therapists WHERE email = new.email
  ) INTO v_is_pre_registered;

  -- 3. Determine Final Role and Status
  IF lower(new.email) = 'anukbin@gmail.com' THEN
    v_role := 'super_admin';
    v_status := 'active';
  ELSIF v_is_pre_registered THEN
    -- If pre-registered, they take the role from therapists table or keep therapist as default
    SELECT COALESCE(system_role, 'therapist') INTO v_role FROM public.therapists WHERE email = new.email;
    v_status := 'active';
  ELSIF v_role = 'parent' THEN
    v_status := 'active'; -- Parents are active by default upon signup
  END IF;

  -- 4. Clean up zombies (Extreme measure to prevent 500 errors)
  DELETE FROM public.user_profiles WHERE email = new.email AND id != new.id;
  
  -- 5. Create user_profile
  INSERT INTO public.user_profiles (id, email, name, role, status, center_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '사용자'), 
    v_role::public.user_role, 
    v_status,
    v_center_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    center_id = COALESCE(public.user_profiles.center_id, EXCLUDED.center_id),
    updated_at = now();

  -- 6. Role-specific Table Sync
  IF v_role IN ('admin', 'therapist') THEN
    -- Update existing therapist record or insert new pending one
    IF v_is_pre_registered THEN
      UPDATE public.therapists 
      SET id = new.id, 
          name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', name),
          center_id = COALESCE(therapists.center_id, v_center_id)
      WHERE email = new.email;
    ELSE
      INSERT INTO public.therapists (id, name, email, color, center_id, system_status, system_role)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '승인대기유저'), 
        new.email, 
        '#cbd5e1',
        v_center_id,
        v_status,
        v_role
      )
      ON CONFLICT (email) DO NOTHING;
    END IF;
    
    -- Notifications for Admin if pending
    IF v_status = 'pending' THEN
      INSERT INTO public.admin_notifications (type, message, user_id, is_read)
      VALUES ('new_user', '새로운 치료사 가입 요청이 있습니다.', new.id, false);
    END IF;

  ELSIF v_role = 'parent' THEN
    -- Create Parent record
    INSERT INTO public.parents (profile_id, center_id, name, email, phone)
    VALUES (
      new.id,
      v_center_id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '학부모'),
      new.email,
      COALESCE(new.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

/**
 * ============================================
 * 🎨 ZARADA MASTER TEMPLATE - Deployment Guide
 * ============================================
 * 
 * This file contains the deployment checklist and
 * configuration guide for launching a new center.
 * 
 * ============================================
 * 
 * ## MINIMUM SETUP CHECKLIST
 * 
 * 1. SUPABASE CONFIGURATION
 *    - Create a new Supabase project at https://supabase.com
 *    - Copy the project URL and anon key
 *    - Update .env file:
 *      VITE_SUPABASE_URL=your-project-url
 *      VITE_SUPABASE_ANON_KEY=your-anon-key
 * 
 * 2. DATABASE SETUP
 *    - Run the SQL schema from database/schema.sql
 *    - Insert center data into 'centers' table:
 *      INSERT INTO centers (name, address, phone, email, weekday_hours, saturday_hours, holiday_text)
 *      VALUES ('센터명', '주소', '전화번호', '이메일', '09:00 - 19:00', '09:00 - 16:00', '일요일/공휴일 휴무');
 * 
 * 3. BRANDING CUSTOMIZATION
 *    - Upload logo to Supabase Storage 'logos' bucket
 *    - Add to admin_settings table:
 *      INSERT INTO admin_settings (key, value) VALUES ('center_logo', 'logo-url');
 *      INSERT INTO admin_settings (key, value) VALUES ('center_name', '센터명');
 * 
 * 4. THEME COLOR (Optional)
 *    - Edit src/index.css
 *    - Change --theme-primary to your brand color
 *    - Example: --theme-primary: #10B981; (Emerald)
 * 
 * 5. DEPLOYMENT
 *    - npm run build
 *    - Deploy dist/ folder to Vercel, Netlify, or any static host
 *    - Set environment variables on hosting platform
 * 
 * ============================================
 * 
 * ## FILES THAT FETCH DYNAMIC DATA
 * 
 * - SplashScreen.tsx - Center name from DB
 * - Footer.tsx - Center info from 'centers' table
 * - HomePage.tsx - Brand name, banner from admin_settings
 * - ContactPage.tsx - Operating hours from 'centers' table
 * - PublicLayout.tsx - Logo from admin_settings
 * 
 * ============================================
 */

export const TEMPLATE_VERSION = '1.0.0';
export const TEMPLATE_NAME = 'Zarada Master Template';

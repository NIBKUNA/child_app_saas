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

// Super Admin 설정
// 이 파일은 시스템의 최상위 관리자 계정을 정의합니다.
// 이 계정은 어떤 상황에서도 자동으로 admin 권한과 active 상태가 부여됩니다.

export const SUPER_ADMIN_EMAILS = ['anukbin@gmail.com'];

// Super Admin 여부 확인 함수
export const isSuperAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
};

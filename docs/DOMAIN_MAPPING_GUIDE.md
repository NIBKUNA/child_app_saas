# 🌐 센터 커스텀 도메인 연결 가이드 (최종)

> **2026.02.13 업데이트**: 코드 수정으로 `www` 도메인 자동 처리가 개선되었습니다.  
> 이제 **DB에는 루트 도메인(예: zaradacenter.co.kr)만 입력**하면, `www`가 붙어도 자동으로 연결됩니다.

---

## 1. 사전 준비

- 연결할 **새 센터**가 앱 내에서 생성되어 있어야 합니다.
- **도메인**을 구매해야 합니다. (예: 가비아, 후이즈 등)

---

## 2. Vercel 도메인 설정 (3분 소요)

1. **Vercel 대시보드** → 프로젝트(`child-app-saas`) → **Settings** → **Domains**
2. 도메인 입력: `example-center.co.kr` (루트 도메인) → **Add**
3. **Recommended** (Production) 선택 → **Add**
4. `www.example-center.co.kr` 도 추가 → **Redirect to example-center.co.kr** 선택
   > 💡 이렇게 하면 `www`로 접속해도 루트 도메인으로 자동 연결되어 관리가 편합니다.

5. Vercel이 알려주는 **A 레코드(IP)**와 **CNAME 값**을 복사합니다.

---

## 3. DNS 설정 (도메인 구입처)

1. 가비아/후이즈 등의 **DNS 관리** 페이지 접속
2. 기존 레코드는 필요 없다면 삭제 (메일(MX) 제외)
3. 아래 2개 레코드 추가:

| 타입 | 호스트 | 값 (Vercel에서 복사한 것) |
|------|--------|---------------------------|
| **A** | **@** | `76.76.21.21` (예시) |
| **CNAME** | **www** | `cname.vercel-dns.com` (예시) |

4. 저장 후 1~5분 대기.

---

## 4. DB 연결 (SQL 실행 - 10초 컷)

⚡ **Supabase SQL Editor**에서 아래 쿼리를 실행하세요.  
(센터 슬러그와 도메인만 바꿔서 쓰시면 됩니다.)

```sql
-- 예시: 강남점(gangnam)에 gangnam-child.com 연결

UPDATE centers 
SET custom_domain = 'gangnam-child.com'  -- ⚠️ http:// 빼고, www 빼고 입력!
WHERE slug = 'gangnam';   -- 연결할 센터의 slug (URL 뒷부분)
```

> **참고:** 이미 코드가 업데이트되어, 사용자가 `www.gangnam-child.com`으로 접속해도 자동으로 이 데이터를 찾아냅니다.

---

## 5. (필수) 방문객 권한 확인

혹시 "데이터를 불러오는 중..." 에서 멈춘다면, 아래 권한 설정이 빠진 것입니다.  
(한 번만 해두면 모든 센터에 적용됩니다.)

```sql
-- 로그인 안 한 방문객도 센터 정보를 볼 수 있게 허용
CREATE POLICY "Public centers are viewable by everyone"
ON centers FOR SELECT TO anon USING ( true );
```

---

## ✅ 연결 확인

브라우저 주소창에 `gangnam-child.com` 입력  
👉 **해당 센터 홈페이지가 뜨면 성공!**

*(만약 계속 로딩 중이면 브라우저 캐시 삭제 후 새로고침하세요)*

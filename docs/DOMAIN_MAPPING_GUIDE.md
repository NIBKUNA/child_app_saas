# 🌐 센터 커스텀 도메인 매핑 가이드

> 새 센터에 독립 도메인을 연결하는 방법입니다.
> 코드 수정이나 배포 없이, DB + Vercel + DNS 설정만으로 완료됩니다.

---

## 📋 전체 순서 요약

| 순서 | 작업 | 어디서 | 소요시간 |
|------|------|--------|----------|
| 1 | 도메인 구매 | 가비아 등 | 5분 |
| 2 | Vercel에 도메인 추가 | Vercel 대시보드 | 3분 |
| 3 | DNS 레코드 변경 | 가비아 DNS 관리 | 5분 |
| 4 | DB에 도메인 매핑 | Supabase SQL Editor | 1분 |

---

## 1단계: 도메인 구매

가비아(gabia.com) 등에서 원하는 도메인을 구매합니다.

**예시:**
- `gangnam-zarada.co.kr` (강남점)
- `wirye-zarada.co.kr` (위례점)
- `ilsan-zarada.com` (일산점)

> 💡 `.co.kr`이 한국 SEO에 약간 유리합니다.

---

## 2단계: Vercel에 도메인 추가

### 2-1. Vercel 대시보드 접속
1. [vercel.com](https://vercel.com) 로그인
2. **child-app-saas** 프로젝트 클릭
3. 상단 **Domains** 탭 클릭

### 2-2. 메인 도메인 추가
1. 상단 입력란에 도메인 입력 (예: `gangnam-zarada.co.kr`)
2. **Add** 클릭
3. **"Connect to an environment"** → **Production** 선택
4. **Save** 클릭

### 2-3. www 도메인 추가
1. `www.gangnam-zarada.co.kr` 입력 → **Add** 클릭
2. **"Redirect to Another Domain"** 선택
3. 오른쪽 칸에 `gangnam-zarada.co.kr` 입력
4. **Save** 클릭

### 2-4. 추천 DNS 값 메모
Vercel이 아래 값을 보여줍니다. **메모해 두세요:**
- **A 레코드 IP:** (예: `216.198.79.1`)
- **CNAME 값:** (예: `xxxx.vercel-dns-017.com`)

---

## 3단계: DNS 레코드 변경 (가비아)

### 3-1. 가비아 DNS 관리 진입
1. [gabia.com](https://www.gabia.com) 로그인
2. **My가비아** → **도메인 관리**
3. 해당 도메인의 **DNS 관리** 클릭

### 3-2. 레코드 추가 (2개만!)

기존 레코드가 있으면 모두 삭제 후 아래 2개만 추가:

#### A 레코드
| 항목 | 입력 |
|------|------|
| 타입 | `A` |
| 호스트 | `@` |
| 값/위치 | 2단계에서 메모한 IP (예: `216.198.79.1`) |
| TTL | `600` |

→ **확인** 클릭

#### CNAME 레코드
| 항목 | 입력 |
|------|------|
| 타입 | `CNAME` |
| 호스트 | `www` |
| 값/위치 | 2단계에서 메모한 CNAME 값 (예: `xxxx.vercel-dns-017.com`) |
| TTL | `600` |

→ **확인** 클릭

### 3-3. 저장 & 확인
1. **저장** 클릭
2. Vercel 도메인 화면에서 **Refresh** 클릭
3. **"Valid Configuration" ✅** 로 바뀌면 성공!

> ⏱ 보통 5~10분이면 적용됩니다.

---

## 4단계: DB에 도메인 매핑 (Supabase)

Supabase 대시보드 → **SQL Editor** 에서 실행:

```sql
-- 센터에 커스텀 도메인 연결
UPDATE centers 
SET custom_domain = 'gangnam-zarada.co.kr' 
WHERE slug = 'gangnam';
```

> ⚠️ `slug`는 해당 센터의 실제 slug로 바꿔주세요.

---

## ✅ 완료 확인

브라우저에서 `gangnam-zarada.co.kr` 접속 → 강남점 홈페이지가 뜨면 성공!

---

## 📌 현재 도메인 매핑 현황

| 센터 | slug | 커스텀 도메인 | 상태 |
|------|------|--------------|------|
| 잠실점 | `jamsil` | `zaradacenter.co.kr` | ✅ 연결됨 |
| (추가 시 여기에 기록) | | | |

---

## ❓ FAQ

### Q: 도메인 없이도 센터 페이지를 사용할 수 있나요?
**A:** 네! 모든 센터는 `app.myparents.co.kr/centers/{slug}` 으로 항상 접근 가능합니다. 커스텀 도메인은 선택사항입니다.

### Q: 하나의 센터에 도메인 여러 개를 연결할 수 있나요?
**A:** 현재는 센터당 1개 도메인만 지원합니다. 추가 도메인이 필요하면 Vercel에서 리다이렉트로 설정할 수 있습니다.

### Q: 도메인을 변경하고 싶으면?
**A:** Supabase에서 `UPDATE centers SET custom_domain = '새도메인' WHERE slug = 'xxx';` 실행하고, Vercel에 새 도메인을 추가하면 됩니다.

### Q: SEO는 자동으로 적용되나요?
**A:** 네! 도메인을 연결하면 크롤러(구글봇, 네이버봇)에게 자동으로 센터 정보가 포함된 HTML이 제공됩니다. 추가 코드 작업은 필요 없습니다.

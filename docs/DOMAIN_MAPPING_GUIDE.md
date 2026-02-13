# 🌐 센터 커스텀 도메인 매핑 가이드

> 기존 센터에 독립 도메인을 연결하는 방법입니다.  
> 코드 수정이나 배포 없이, DB + Vercel + DNS 설정만으로 완료됩니다.

---

## 전제 조건

- 센터가 이미 DB에 생성되어 있어야 합니다 (앱에서 센터 생성 완료)
- `centers` 테이블에 `custom_domain` 컬럼이 있어야 합니다

---

## 📋 도메인 연결 순서 (3단계, 약 15분)

### 1단계: 도메인 구매 + Vercel 추가

1. **가비아**(gabia.com) 등에서 도메인 구매
2. **Vercel** 대시보드 → child-app-saas → **Domains** 탭
3. 도메인 입력 (예: `gangnam-zarada.co.kr`) → **Add**
4. **"Connect to an environment"** → **Production** → **Save**
5. `www.도메인` 도 추가 → **"Redirect to Another Domain"** → 메인 도메인 입력 → **Save**
6. Vercel이 보여주는 **A 레코드 IP**와 **CNAME 값**을 메모

### 2단계: DNS 설정 (가비아)

1. 가비아 로그인 → **My가비아** → **도메인 관리** → **DNS 관리**
2. 기존 레코드 모두 삭제 (MX 메일 레코드는 유지)
3. 아래 2개만 추가:

| 타입 | 호스트 | 값 | TTL |
|------|--------|-----|-----|
| A | @ | Vercel에서 메모한 IP | 600 |
| CNAME | www | Vercel에서 메모한 CNAME 값 | 600 |

4. **저장** → Vercel에서 **Refresh** → **"Valid Configuration" ✅** 확인

### 3단계: DB에 도메인 연결 (1줄)

Supabase SQL Editor에서:

```sql
UPDATE centers SET custom_domain = '구매한도메인.co.kr' WHERE slug = '센터slug';
```

---

## ✅ 완료 확인

브라우저에서 구매한 도메인 접속 → 해당 센터 홈페이지가 뜨면 성공!

---

## 📌 현재 도메인 매핑 현황

| 센터 | slug | 커스텀 도메인 | 기본 URL |
|------|------|--------------|----------|
| 잠실점 | `jamsil` | `zaradacenter.co.kr` | `app.myparents.co.kr/centers/jamsil` |
| (추가 시 여기에 기록) | | | |

> 모든 센터는 커스텀 도메인이 없어도 `app.myparents.co.kr/centers/{slug}`로 항상 접근 가능합니다.

---

## ❓ FAQ

**Q: 도메인 변경하고 싶으면?**  
→ `UPDATE centers SET custom_domain = '새도메인' WHERE slug = 'xxx';` + Vercel에 새 도메인 추가

**Q: 도메인 해제하고 싶으면?**  
→ `UPDATE centers SET custom_domain = NULL WHERE slug = 'xxx';` + Vercel에서 도메인 삭제

**Q: SEO는 자동인가요?**  
→ 네. 도메인 연결하면 구글/네이버에 자동으로 센터 정보가 노출됩니다.

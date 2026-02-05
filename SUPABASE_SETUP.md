# Supabase 연동 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 비밀번호, 리전 설정 후 생성

## 2. 환경 변수 설정

`.env` 파일에 다음 변수를 추가하세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_KAKAO_MAP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # 지도 + 주소→위경도 변환용
```

- **URL**: Supabase 대시보드 → Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → anon public
- **NEXT_PUBLIC_KAKAO_MAP_KEY**: [Kakao Developers](https://developers.kakao.com) → 앱 키 → **JavaScript 키**. **제품 설정** → **카카오맵** 활성화.
- **KAKAO_REST_API_KEY** (서버용) / **NEXT_PUBLIC_KAKAO_REST_API_KEY** (클라이언트 fallback): 앱 키 → **REST API 키**. **제품 설정** → **로컬** 활성화. (주소→위경도 변환에 필요, 둘 중 하나 이상 설정)

## 3. 데이터베이스 스키마 적용

Supabase 대시보드 → **SQL Editor**에서 아래 순서로 실행:

1. `supabase/migrations/0001_initial_schema.sql` 전체 복사 후 실행
2. `supabase/seed.sql` 전체 복사 후 실행 (시드 데이터)

## 4. 동작 방식

- **Supabase 필수**: 환경 변수 미설정 시 앱이 에러를 냅니다.
- 매장/재고 데이터는 모두 Supabase에서 조회·저장됩니다.
- **세션 유지**: `middleware.ts`가 매 요청마다 Supabase 세션을 갱신합니다. 이 파일이 없으면 로그인 상태가 유지되지 않을 수 있습니다.

## 5. 카카오 로그인 설정

1. [Kakao Developers](https://developers.kakao.com)에서 앱 생성
2. **앱 설정** → **플랫폼** → **웹** 플랫폼 추가
3. **카카오 로그인** 활성화, Redirect URI 추가:
   - 로컬: `https://<project-ref>.supabase.co/auth/v1/callback`
   - (Supabase 대시보드 → Authentication → Providers → Kakao에서 Callback URL 확인)
4. **Client Secret** 발급 (앱 설정 → 앱 키)
5. **⚠️ 동의 항목 설정 (KOE205 에러 해결)**  
   Supabase는 Kakao 로그인 시 아래 3개 동의 항목을 **필수**로 요청합니다.  
   **제품 설정** → **카카오 로그인** → **동의항목**에서 다음을 설정하세요:
   - `account_email` (카카오계정 이메일) — **비즈앱 전용**: 앱 설정 → 앱 → 일반 → 사업자 정보 입력 후 비즈앱 전환 필요
   - `profile_nickname` (닉네임)
   - `profile_image` (프로필 사진)
   
   > `account_email`은 **비즈앱**에서만 사용 가능합니다.  
   > 비즈앱 전환: **앱 설정** → **앱** → **일반** → **사업자 정보** 섹션 작성 후 비즈앱으로 전환
6. Supabase 대시보드 → **Authentication** → **Providers** → **Kakao**:
   - Enabled ON
   - Client ID: Kakao REST API 키
   - Client Secret: Kakao Login Client Secret
7. **Authentication** → **URL Configuration** → **Redirect URLs**에 추가:
   - `http://localhost:3000/auth/callback`
   - 배포 URL (예: `https://your-app.vercel.app/auth/callback`)

## 6. 카카오 로그인 에러 해결 (KOE205)

**에러**: "설정하지 않은 카카오 로그인 동의 항목을 포함해 인가 코드를 요청했습니다"

**원인**: Supabase가 `account_email`, `profile_image`, `profile_nickname`을 요청하는데, 카카오 앱에 해당 동의 항목이 설정되지 않음.

**해결**:
1. [Kakao Developers](https://developers.kakao.com) → 내 앱 선택
2. **제품 설정** → **카카오 로그인** → **동의항목**
3. 아래 3개 항목을 **설정** 상태로 변경:
   - 카카오계정(이메일) — 비즈앱만 가능
   - 닉네임
   - 프로필 사진

**account_email이 안 보이는 경우**: 비즈앱 전환이 필요합니다.  
**앱 설정** → **앱** → **일반** → **사업자 정보** 입력 후 비즈앱으로 전환하세요.

## 7. owners ↔ auth.users 연동

로그인한 사용자와 owners 테이블을 연결하려면 마이그레이션을 실행하세요:

1. Supabase 대시보드 → **SQL Editor**
2. `supabase/migrations/0002_add_auth_user_id_to_owners.sql` 내용 실행
3. 기존 시드 owner(id=1)를 테스트용 auth 사용자와 연결하려면:
   - Supabase → Authentication → Users에서 해당 사용자 UUID 확인
   - `UPDATE owners SET auth_user_id = '<uuid>' WHERE id = 1;` 실행

로그인 시 owner가 없으면 자동으로 생성됩니다.

## 8. 추후 개선 사항
- **Supabase Storage**: 대표 사진, 가챠 이미지 업로드
- **RLS 정책**: 인증된 사용자만 본인 매장 수정 가능하도록 제한

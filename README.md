# 가챠·쿠지 맵

가챠(캡슐 토이)와 이치방쿠지 매장 위치를 한눈에! 주변 매장을 찾아보세요.

## 프로젝트 개요

- **사용자**: 지도에서 가챠/쿠지 매장을 검색하고, 위치·재고·영업시간을 확인
- **사장님**: 카카오 로그인 후 입점 신청, 매장 재고·가챠·쿠지 현황 관리

## 주요 기능

### 사용자
- **지도**: 카카오맵 기반 매장 위치 표시
- **필터**: 가챠 / 쿠지 / 둘 다 탭으로 매장 유형 필터링
- **내 위치**: 현재 위치 기준으로 주변 매장 탐색
- **매장 상세**: 마커 클릭 시 시트에서 상세 정보 (가챠 머신, 쿠지 현황, 영업시간, 등급별 재고)
- **최근 업데이트**: "n분 전" 업데이트 시각 + 업데이트 주체 배지 (운영자/매장관리자/검증됨)

### 사장님
- **카카오 로그인**: OAuth 인증
- **입점 신청**: 주소 검색 → 근처 매장 확인 → "있어요" 클레임 / "없어요" 신규 등록 (중복 방지)
- **클레임**: 기존 매장을 내 매장으로 신청 → 운영자 승인 후 관리 권한
- **업장 관리**: 보유한 매장 목록 조회
- **대시보드**: 프로모션 문구, 영업시간, 휴무일, 가챠 머신, 쿠지 현황 CRUD

### 운영자 (Admin)
- **운영자 대시보드** (`/admin`): 매장 직접 추가, 신규 등록/클레임 승인·거절

## 페이지 구조

```
/ (홈)
├── 지도 + 필터 + 매장 마커 + 상세 시트
├── 메뉴 (우측 상단) → FAQ, 사장님 로그인/업장 관리/업장 추가/로그아웃, 운영자 대시보드(admin만)
└── 내위치 기준 탐색 버튼

/admin (운영자 대시보드)
├── role=admin 체크 → 아니면 / 리다이렉트
├── 승인 대기: 신규 등록(PENDING) + 클레임(PENDING) 승인/거절
└── 매장 추가: 운영자 직접 매장 등록 (즉시 공개)

/owner/login (사장님 로그인)
├── 카카오 로그인 버튼
└── 로그인 후 → /auth/callback → /owner/shops

/auth/callback (OAuth 콜백)
└── code 교환 → owner 생성 → /owner/shops (또는 next 파라미터)

/owner/register (입점 신청)
├── 로그인 필수 → /owner/login
├── 주소 검색 → 근처(50m) 매장 확인 → "있어요" 클레임 / "없어요" 신규 등록
├── 신규 등록: 운영자 즉시 공개, 일반 사장님은 PENDING → 운영자 승인 후 공개
└── 등록/클레임 성공 → /owner/shops

/owner/shops (업장 목록)
├── 로그인 필수 → /owner/login
├── owner 없음 → /owner/register
├── 업장 없음 → 업장 추가 버튼 → /owner/register
└── 업장 있음 → 카드 클릭 → /owner/dashboard?shopId=${id}

/owner/dashboard (업장 대시보드)
├── 로그인 + owner 필수 → /owner/register 또는 /owner/shops
├── shopId 없으면 첫 번째 업장으로 자동
├── 프로모션 / 가챠 / 쿠지 탭 관리
└── 저장 → Supabase 업데이트
```

## 페이지 연결 흐름

```
[메인 지도] → 메뉴 → 사장님 로그인 → /owner/login
                                    → 카카오 로그인
                                    → /auth/callback
                                    → /owner/shops

[메인 지도] → 메뉴 → 업장 관리 → /owner/shops (로그인 시)
                              → 업장 선택 → /owner/dashboard

[메인 지도] → 메뉴 → 업장 추가 → /owner/register (로그인 시)

[메인 지도] → 메뉴 → 운영자 대시보드 → /admin (admin만)

/owner/shops → 업장 없음 → 업장 추가 → /owner/register
           → 업장 있음 → 카드 클릭 → /owner/dashboard?shopId=${id}

/owner/dashboard → shopId 없으면 → /owner/shops 리다이렉트
```

## 기술 스택

- **Next.js 16** (App Router)
- **Supabase** (Auth, DB, Storage)
- **TanStack Query** (서버 데이터 캐싱)
- **카카오맵 API** (지도, 주소→위경도)
- **카카오 OAuth** (로그인)
- **Tailwind CSS**, **Radix UI**, **Lucide React**

## 환경 변수

`.env` 파일에 다음 변수가 필요합니다:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_KAKAO_MAP_KEY` (지도)
- `KAKAO_REST_API_KEY` (주소→위경도 변환)

자세한 설정은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참고하세요.

## Getting Started

개발 서버 실행:

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## Deploy on Vercel

[Vercel Platform](https://vercel.com/new)에서 Next.js 앱을 배포할 수 있습니다.

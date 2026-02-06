# Supabase SQL Editor 사용 가이드

Supabase 대시보드에서 SQL을 실행하는 방법과 마이그레이션 적용 순서를 안내합니다.

## 1. SQL Editor 접속

1. [supabase.com](https://supabase.com) 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼으로 새 쿼리 창 열기

## 2. 마이그레이션 실행 순서

아래 순서대로 **한 번에 하나씩** 실행하세요. 각 파일 내용을 복사해 SQL Editor에 붙여넣고 **Run** (또는 Ctrl/Cmd + Enter)을 누릅니다.

### 2-1. 초기 스키마 (0001)

> ⚠️ `0001_initial_schema.sql` 파일이 프로젝트에 없다면, 이미 Supabase에 스키마가 적용된 상태일 수 있습니다. 기존 프로젝트를 이어받았다면 이 단계를 건너뛰세요.

### 2-2. owners에 auth_user_id 추가 (0002)

> ⚠️ `0002_add_auth_user_id_to_owners.sql` 파일이 있다면 실행. 없으면 이미 적용된 상태일 수 있습니다.

### 2-3. 휴무요일, 쿠지 이미지 (0003)

```sql
-- supabase/migrations/0003_add_closed_days_and_kuji_image.sql 내용
```

**파일 경로**: `supabase/migrations/0003_add_closed_days_and_kuji_image.sql`

- `shops` 테이블에 `closed_days` 컬럼 추가
- `kuji_statuses` 테이블에 `image_url` 컬럼 추가

### 2-4. 매장 이미지 Storage 버킷 (0004)

**파일 경로**: `supabase/migrations/0004_shop_images_storage.sql`

- `shop-images` Storage 버킷 생성 (5MB 제한, 이미지 파일만)
- 인증된 사용자 업로드 정책 설정

### 2-5. 클레임/승인 테이블 (0005)

**파일 경로**: `supabase/migrations/0005_claim_approval.sql`

- `owners.role` 추가
- `shops.status`, `shops.update_source` 추가
- `shop_claims`, `shop_registration_requests` 테이블 생성

### 2-6. 시드 데이터 (선택)

**파일 경로**: `supabase/seed.sql`

- ⚠️ **기존 데이터 전체 삭제** 후 더미 매장 데이터 삽입
- 개발/테스트용입니다. 운영 환경에서는 실행하지 마세요.

## 3. 실행 방법 요약

| 순서 | 파일 | 설명 |
|------|------|------|
| 1 | `0003_add_closed_days_and_kuji_image.sql` | 휴무요일, 쿠지 이미지 컬럼 |
| 2 | `0004_shop_images_storage.sql` | 이미지 Storage 버킷 |
| 3 | `0005_claim_approval.sql` | 클레임/승인 관련 테이블 |
| 4 | `seed.sql` | (선택) 더미 데이터 |

## 4. Supabase SQL Editor 사용 팁

### 4-1. 쿼리 실행

- **Run** 버튼 클릭 또는 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
- 여러 문장이 있으면 **전체 실행**됨
- 일부만 실행하려면 해당 부분을 드래그 후 Run

### 4-2. 결과 확인

- 실행 후 하단에 **Results** 탭에서 결과 확인
- 에러가 있으면 **Error** 메시지 확인

### 4-3. 트랜잭션

- 기본적으로 각 문장이 개별 트랜잭션으로 실행됨
- `BEGIN;` ... `COMMIT;` 으로 묶어서 실행하려면 전체를 한 번에 실행

## 5. 자주 쓰는 SQL

### 운영자(Admin) 지정

```sql
UPDATE owners SET role = 'admin' WHERE id = 1;
-- 또는 이메일로: WHERE email = 'your@email.com';
```

### owner와 auth 사용자 연결

```sql
-- Supabase → Authentication → Users에서 UUID 확인 후
UPDATE owners SET auth_user_id = '여기에-uuid-입력' WHERE id = 1;
```

### 매장 승인 상태 확인

```sql
SELECT id, name, status, update_source FROM shops;
```

### Storage 버킷 확인

```sql
SELECT * FROM storage.buckets;
```

## 6. 문제 해결

### "relation does not exist" 에러

- 마이그레이션 순서가 맞는지 확인
- 0003, 0004, 0005를 0001(초기 스키마) 이후에 실행했는지 확인

### "policy already exists" 에러

- `DROP POLICY IF EXISTS` 가 있는 마이그레이션은 다시 실행해도 됨
- 또는 해당 정책을 수동으로 삭제 후 다시 실행

### Storage 업로드 실패

- 0004 마이그레이션이 실행되었는지 확인
- Supabase → Storage에서 `shop-images` 버킷 존재 여부 확인
- Authentication → Providers에서 로그인 설정 확인

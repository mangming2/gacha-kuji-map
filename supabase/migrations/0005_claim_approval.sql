-- owners: role 추가 (admin | owner)
ALTER TABLE owners ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- shops: status, update_source, last_updated_by 추가
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'APPROVED';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS update_source TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_updated_by INTEGER REFERENCES owners(id);

-- 기존 shops에 기본값 설정
UPDATE shops SET status = 'APPROVED' WHERE status IS NULL;
UPDATE shops SET update_source = 'operator' WHERE update_source IS NULL AND status = 'APPROVED';

-- shop_claims: 클레임 신청 테이블 (기존 매장을 내 매장으로 신청)
CREATE TABLE IF NOT EXISTS shop_claims (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id),
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, shop_id)
);

-- shop_registration_requests: 신규 매장 등록 요청 (승인 후 shop_owners 연결)
CREATE TABLE IF NOT EXISTS shop_registration_requests (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id),
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id)
);

-- shops 테이블에 휴무요일 컬럼 추가
ALTER TABLE shops ADD COLUMN IF NOT EXISTS closed_days TEXT;

-- kuji_statuses 테이블에 대표 이미지 컬럼 추가
ALTER TABLE kuji_statuses ADD COLUMN IF NOT EXISTS image_url TEXT;

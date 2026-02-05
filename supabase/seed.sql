-- 더미 데이터 시드
-- 실행 순서: 0001_initial_schema.sql → 0003_add_closed_days_and_kuji_image.sql → 본 파일
-- 이미지: Unsplash URL (무료, Next.js images.unsplash.com 허용됨)

-- 기존 시드 데이터 정리 (재시드 시 아래 주석 해제 후 실행)
-- TRUNCATE gacha_machines, kuji_statuses, shop_owners, shops RESTART IDENTITY CASCADE;

-- 매장 더미 데이터 (서울/경기 지역)
INSERT INTO shops (name, type, lat, lng, address, stock_status, is_open, business_hours, closed_days, representative_image_url, promotional_text, last_updated_at, created_at, updated_at)
VALUES
  (
    '복권천국 명동',
    'KUJI',
    37.5637,
    126.9870,
    '서울특별시 중구 명동8길 27',
    '라스트원상 임박',
    true,
    '10:30 - 21:30',
    '매주 일요일',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
    '원피스, 짱구 등 인기 쿠지 풍부! 라스트원상 실시간 업데이트',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '가챠랜드 홍대',
    'GACHA',
    37.5563,
    126.9220,
    '서울특별시 마포구 와우산로29길 15',
    NULL,
    true,
    '11:00 - 22:00',
    '매주 월요일',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop',
    '치이카와, 귀멸의 칼날 등 신작 가챠 머신 다수 보유',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '토이스토리 강남',
    'BOTH',
    37.4979,
    127.0276,
    '서울특별시 강남구 강남대로 396',
    NULL,
    true,
    '10:00 - 21:00',
    '명절 당일',
    'https://images.unsplash.com/photo-1610701596007-11502861dcba?w=400&h=400&fit=crop',
    '가챠+쿠지 통합 매장. 스파이패밀리, 원피스 프리미엄 등 인기 상품',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '테스트 매장 (아이콘용)',
    'GACHA',
    37.5172,
    127.0473,
    '서울특별시 송파구 올림픽로 300',
    NULL,
    false,
    '09:00 - 18:00',
    '매주 토·일요일',
    NULL,
    NULL,
    NOW(),
    NOW(),
    NOW()
  );

-- 가챠 머신 (가챠랜드 홍대, 토이스토리 강남)
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 1호', '치이카와', 15, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop', NOW()
FROM shops s WHERE s.name = '가챠랜드 홍대' LIMIT 1;
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 2호', '귀멸의 칼날', 8, 'https://images.unsplash.com/photo-1610701596007-11502861dcba?w=200&h=200&fit=crop', NOW()
FROM shops s WHERE s.name = '가챠랜드 홍대' LIMIT 1;
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 3호', '원피스', 3, NULL, NOW()
FROM shops s WHERE s.name = '가챠랜드 홍대' LIMIT 1;
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 A', '스파이패밀리', 20, 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=200&h=200&fit=crop', NOW()
FROM shops s WHERE s.name = '토이스토리 강남' LIMIT 1;
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 B', '진격의 거인', 5, NULL, NOW()
FROM shops s WHERE s.name = '토이스토리 강남' LIMIT 1;
INSERT INTO gacha_machines (shop_id, name, series, stock, image_url, created_at)
SELECT s.id, '캡슐토이 C', '테스트 시리즈', 0, NULL, NOW()
FROM shops s WHERE s.name = '테스트 매장 (아이콘용)' LIMIT 1;

-- 쿠지 현황 (복권천국 명동, 토이스토리 강남)
INSERT INTO kuji_statuses (shop_id, name, status, stock, grade_status, image_url, created_at)
SELECT s.id, '원피스 프리미엄', '라스트원상 임박', 1, '[{"grade":"A상","count":0},{"grade":"B상","count":0},{"grade":"C상","count":0},{"grade":"라스트원","count":1}]'::jsonb, 'https://images.unsplash.com/photo-1610701596007-11502861dcba?w=200&h=200&fit=crop', NOW()
FROM shops s WHERE s.name = '복권천국 명동' LIMIT 1;
INSERT INTO kuji_statuses (shop_id, name, status, stock, grade_status, image_url, created_at)
SELECT s.id, '짱구 복권', 'A상 생존', 12, '[{"grade":"A상","count":1},{"grade":"B상","count":4},{"grade":"C상","count":7}]'::jsonb, NULL, NOW()
FROM shops s WHERE s.name = '복권천국 명동' LIMIT 1;
INSERT INTO kuji_statuses (shop_id, name, status, stock, grade_status, image_url, created_at)
SELECT s.id, '스파이패밀리 복권', '신규', 80, '[{"grade":"A상","count":2},{"grade":"B상","count":10},{"grade":"C상","count":68}]'::jsonb, 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=200&h=200&fit=crop', NOW()
FROM shops s WHERE s.name = '토이스토리 강남' LIMIT 1;

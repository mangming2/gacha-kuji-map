-- 더미 데이터 시드
-- 실행 순서: 0001_initial_schema.sql → 0003_add_closed_days_and_kuji_image.sql → 본 파일
-- 이미지: Unsplash URL (무료, Next.js images.unsplash.com 허용됨)

-- ⚠️ 기존 데이터 전체 삭제 후 새 데이터 삽입 (Supabase SQL Editor에서 실행)
TRUNCATE gacha_machines, kuji_statuses, shop_owners, shops RESTART IDENTITY CASCADE;

-- 매장 더미 데이터 (서울 지역)
INSERT INTO shops (name, type, lat, lng, address, stock_status, is_open, business_hours, closed_days, representative_image_url, promotional_text, last_updated_at, created_at, updated_at)
VALUES
  ('애니메이트 잠실점', 'KUJI', 37.5132, 127.1028, '서울특별시 송파구 올림픽로 240', NULL, true, '10:00 - 21:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('로이쿠지 파일섬', 'KUJI', 37.5028, 127.1245, '서울특별시 송파구 오금로13길 13', NULL, true, '11:00 - 22:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('가챠마트', 'BOTH', 37.5020, 127.1270, '서울특별시 송파구 오금로 146', NULL, true, '07:00 - 02:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('쿠지냥', 'KUJI', 37.5105, 127.1085, '서울특별시 송파구 백제고분로7길 15', NULL, true, '14:00 - 21:00', '월요일', NULL, NULL, NOW(), NOW(), NOW()),
  ('나나가챠', 'BOTH', 37.5448, 127.0370, '서울특별시 성동구 서울숲2길 11', NULL, true, '12:00 - 20:00', '월요일', NULL, NULL, NOW(), NOW(), NOW()),
  ('다비츠가챠', 'BOTH', 37.5440, 127.0390, '서울특별시 성동구 서울숲6길 10', NULL, true, '09:00 - 21:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('별보러가챠', 'BOTH', 37.5512, 127.0798, '서울특별시 광진구 능동로 131', NULL, true, '12:00 - 21:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('토이쩔어스', 'KUJI', 37.5525, 127.0895, '서울특별시 광진구 아차산로26길 27', NULL, true, '14:00 - 21:00', '월요일', NULL, NULL, NOW(), NOW(), NOW()),
  ('코엑스 건담베이스', 'KUJI', 37.5128, 127.0592, '서울특별시 강남구 영동대로 513', NULL, true, '10:00 - 22:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('캡슐팡 스타필드코엑스몰', 'BOTH', 37.5052, 127.0488, '서울특별시 강남구 봉은사로 524', NULL, true, '10:00 - 22:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('애니팝굿즈샵', 'BOTH', 37.5178, 127.0408, '서울특별시 강남구 영동대로85길 13', NULL, true, '11:00 - 21:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('우주가챠', 'BOTH', 37.5065, 127.0465, '서울특별시 강남구 봉은사로2길 13', NULL, true, '13:00 - 21:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('애니피스', 'KUJI', 37.5088, 127.0125, '서울특별시 서초구 신반포로47길 33', NULL, true, '12:30 - 19:00', '일 월 화', NULL, NULL, NOW(), NOW(), NOW()),
  ('브라더굿즈 강남', 'BOTH', 37.4975, 127.0285, '서울특별시 강남구 강남대로102길 13', NULL, true, '12:00 - 22:00', NULL, NULL, NULL, NOW(), NOW(), NOW()),
  ('카드냥', 'KUJI', 37.5012, 127.0355, '서울특별시 강남구 논현로77길 9', NULL, true, '14:00 - 22:30', NULL, NULL, NULL, NOW(), NOW(), NOW());

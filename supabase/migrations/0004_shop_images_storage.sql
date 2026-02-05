-- 매장 대표 이미지용 Storage 버킷 생성 (5MB 제한, 이미지만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자만 shop-images 버킷에 업로드 가능
DROP POLICY IF EXISTS "Authenticated users can upload shop images" ON storage.objects;
CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

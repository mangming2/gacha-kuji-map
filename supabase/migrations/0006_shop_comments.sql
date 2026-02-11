-- 가게 현황 제보(댓글) 테이블
CREATE TABLE IF NOT EXISTS shop_comments (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_comments_shop_id ON shop_comments(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_comments_created_at ON shop_comments(shop_id, created_at DESC);

COMMENT ON TABLE shop_comments IS '가게별 사용자 현황 제보(피드) - 로그인 유저가 텍스트/사진으로 제보';

-- RLS: 읽기는 모두 허용, 작성은 로그인한 본인(owner)만
ALTER TABLE shop_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shop_comments"
  ON shop_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own comment"
  ON shop_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (SELECT id FROM owners WHERE auth_user_id = auth.uid())
  );

-- 댓글 이미지용 Storage 버킷 (영구 보존, 1MB 제한)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-comment-images',
  'shop-comment-images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload shop comment images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shop-comment-images');

CREATE POLICY "Anyone can read shop comment images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'shop-comment-images');

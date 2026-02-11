-- RLS와 관계없이 로그인한 사용자가 본인 표시 이름만 수정할 수 있도록 함수 사용
CREATE OR REPLACE FUNCTION update_owner_display_name(new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE owners
  SET name = trim(new_name)
  WHERE auth_user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION update_owner_display_name(text) IS '마이페이지: 로그인한 사용자의 표시 이름(닉네임) 수정';

GRANT EXECUTE ON FUNCTION update_owner_display_name(text) TO authenticated;

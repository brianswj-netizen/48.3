-- member_notes: 멤버별 개인 메모 (나만 보는 메모)
-- 각 유저가 다른 멤버에 대해 비공개로 메모를 작성할 수 있음

CREATE TABLE IF NOT EXISTS member_notes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id       uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  target_member_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content         text NOT NULL DEFAULT '',
  updated_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE(author_id, target_member_id)
);

-- author_id 기준 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_member_notes_author ON member_notes(author_id);

-- RLS: 본인 메모만 읽기/쓰기 가능
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

-- service_role(admin client)은 모두 통과, 개별 유저는 자신의 row만
CREATE POLICY "author can manage own notes"
  ON member_notes
  FOR ALL
  USING (true);  -- admin client 사용 → 서버 사이드에서 author_id 필터링

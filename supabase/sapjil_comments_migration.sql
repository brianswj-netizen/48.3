-- 삽질기 댓글
CREATE TABLE IF NOT EXISTS sapjil_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES sapjil_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sapjil_comments_post_id ON sapjil_comments(post_id);
ALTER TABLE sapjil_comments ENABLE ROW LEVEL SECURITY;

-- image_url column for sapjil_posts (if not exists)
ALTER TABLE sapjil_posts ADD COLUMN IF NOT EXISTS image_url text;

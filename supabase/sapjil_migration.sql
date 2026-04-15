-- 삽질기 게시물
CREATE TABLE IF NOT EXISTS sapjil_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sapjil_posts_created ON sapjil_posts(created_at DESC);
ALTER TABLE sapjil_posts ENABLE ROW LEVEL SECURITY;

-- 삽질기 반응 (이모지)
CREATE TABLE IF NOT EXISTS sapjil_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES sapjil_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE sapjil_reactions ENABLE ROW LEVEL SECURITY;

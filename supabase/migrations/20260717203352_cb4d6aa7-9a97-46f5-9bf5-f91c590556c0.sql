
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  reading_minutes integer NOT NULL DEFAULT 5,
  published_at timestamptz NOT NULL DEFAULT now(),
  author_name text NOT NULL DEFAULT 'EmailsLy Team',
  author_role text NOT NULL DEFAULT 'Editorial',
  author_initials text NOT NULL DEFAULT 'EM',
  cover_eyebrow text NOT NULL DEFAULT 'Playbook',
  cover_kicker text NOT NULL DEFAULT '',
  cover_image text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  content_md text NOT NULL DEFAULT '',
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can view all posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX blog_posts_published_at_idx ON public.blog_posts (published_at DESC);
CREATE INDEX blog_posts_published_idx ON public.blog_posts (published);

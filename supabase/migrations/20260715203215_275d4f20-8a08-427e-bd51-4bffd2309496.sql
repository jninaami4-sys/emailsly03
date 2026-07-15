UPDATE public.social_links
SET href = CASE platform
  WHEN 'email'     THEN 'mailto:hello@emailsly.com'
  WHEN 'instagram' THEN 'https://instagram.com/emailsly'
  WHEN 'telegram'  THEN 'https://t.me/emailsly'
  WHEN 'facebook'  THEN 'https://facebook.com/emailsly'
  ELSE href
END
WHERE platform IN ('email', 'instagram', 'telegram', 'facebook');
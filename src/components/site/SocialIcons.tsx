/**
 * SocialIcons — footer social buttons rendered from the `social_links`
 * admin-managed table. Admin can enable/disable each platform.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Mail,
  Instagram,
  Send,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  Github,
  Link as LinkIcon,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPublicSocialLinks, type SocialIconKey } from "@/lib/social-links.functions";

const ICONS: Record<SocialIconKey, typeof Mail> = {
  whatsapp: MessageCircle,
  email: Mail,
  instagram: Instagram,
  telegram: Send,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  discord: MessagesSquare,
  github: Github,
  link: LinkIcon,
};

export function SocialIcons() {
  const listFn = useServerFn(listPublicSocialLinks);
  const { data } = useQuery({
    queryKey: ["public-social-links"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  const socials = data ?? [];
  if (socials.length === 0) return null;

  return (
    <nav aria-label="Social links">
      <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {socials.map((s) => {
          const Icon = ICONS[s.icon as SocialIconKey] ?? LinkIcon;
          const isExternal = s.href.startsWith("http");
          return (
            <li key={s.id}>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-11 rounded-full border-white/10 bg-white/5 text-white transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg sm:size-12"
                style={{ ["--icon-color" as never]: s.color }}
              >
                <a
                  href={s.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                  title={s.platform}
                  className="[&_svg]:text-[var(--icon-color)]"
                >
                  <Icon className="size-5" />
                </a>
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * SocialIcons — centered row of shadcn Button icon buttons
 * for WhatsApp, Email, Instagram, Telegram.
 */

import type { ReactNode } from "react";
import { Mail, Instagram, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Social = {
  name: string;
  href: string;
  label: string;
  color: string;
  icon: ReactNode;
};

const SOCIALS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/919999999999",
    label: "Chat on WhatsApp",
    color: "#25D366",
    icon: <MessageCircle className="size-5" />,
  },
  {
    name: "Email",
    href: "mailto:hello@lyradata.com",
    label: "Email us",
    color: "#EA4335",
    icon: <Mail className="size-5" />,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/lyradata",
    label: "Follow on Instagram",
    color: "#E1306C",
    icon: <Instagram className="size-5" />,
  },
  {
    name: "Telegram",
    href: "https://t.me/lyradata",
    label: "Message on Telegram",
    color: "#229ED9",
    icon: <Send className="size-5" />,
  },
];

export function SocialIcons() {
  return (
    <div className="flex w-full justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-3">
        {SOCIALS.map((s) => (
          <li key={s.name}>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-full transition-transform hover:-translate-y-0.5 hover:shadow-md"
              style={{ color: s.color, borderColor: `${s.color}40` }}
            >
              <a
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={s.label}
                title={s.name}
              >
                {s.icon}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Home, Store, Tag, Mail } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: NavItem[] = [
    { id: "home", icon: <Home />, label: "Home", onClick: () => navigate({ to: "/" }) },
    { id: "store", icon: <Store />, label: "Store", onClick: () => navigate({ to: "/store" }) },
    { id: "pricing", icon: <Tag />, label: "Pricing", onClick: () => navigate({ to: "/pricing" }) },
    { id: "contact", icon: <Mail />, label: "Contact", onClick: () => navigate({ to: "/contact" }) },
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((i) =>
      i.id === "home" ? pathname === "/" : pathname.startsWith(`/${i.id}`)
    )
  );

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden"
      style={{ ["--primary" as never]: "var(--neon-orange)" }}
    >
      <LimelightNav
        items={items}
        defaultActiveIndex={activeIndex}
        key={activeIndex}
        className="border-white/10 bg-midnight-surface/90 shadow-lg backdrop-blur-xl"
        iconClassName="text-foreground"
      />
    </div>
  );
}

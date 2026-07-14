import { ShoppingBag } from "lucide-react";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";
import { openOrderDrawer } from "./OrderDrawer";

export function MobileBottomNav() {
  const items: NavItem[] = [
    { id: "order", icon: <ShoppingBag />, label: "Order Now", onClick: () => openOrderDrawer() },
  ];

  const activeIndex = 0;

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden"
      style={{ ["--primary" as never]: "var(--neon-blue)" }}
    >
      <LimelightNav
        items={items}
        defaultActiveIndex={activeIndex}
        key={activeIndex}
        className="bg-ink border-white/10"
        iconClassName="text-foreground"
      />
    </div>
  );
}

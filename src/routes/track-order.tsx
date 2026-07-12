import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { OrderForm } from "@/components/site/OrderForm";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Place your order | LyraData" },
      { name: "description", content: "Start a new LyraData order — verified B2B lead data delivered within 24 hours." },
      { property: "og:title", content: "Place your order | LyraData" },
      { property: "og:description", content: "Start a new LyraData order — verified B2B lead data delivered within 24 hours." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  return (
    <SiteShell>
      <OrderForm />
    </SiteShell>
  );
}

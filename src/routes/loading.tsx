import { createFileRoute } from "@tanstack/react-router";
import { Preloader } from "@/components/site/Preloader";

export const Route = createFileRoute("/loading")({
  head: () => ({
    meta: [
      { title: "Loading — EmailsLy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [{ rel: "canonical", href: "/loading" }],
  }),
  component: LoadingPage,
});

function LoadingPage() {
  // Standalone full-screen loading page — always plays, ignores session guard.
  return <Preloader force everyLoad maxDurationMs={2500} sequenceMs={2200} />;
}

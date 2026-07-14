/**
 * TvNotFound — retro TV illustration for 404 / error boundaries.
 * Illustration adapted from Uiverse.io (Praashoo7), design inspired by
 * Stefan Devai (Dribbble). All styles live under `.tv-nf` scope in styles.css.
 */
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";

export function TvNotFound({
  code = "404",
  title = "Lost in transmission",
  subtitle = "The page you're looking for isn't broadcasting. Check the URL or head back home.",
  screenText = "NOT FOUND",
  onRetry,
}: {
  code?: string;
  title?: string;
  subtitle?: string;
  screenText?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="tv-nf relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="main_wrapper">
        <div className="main">
          <div className="antenna">
            <div className="antenna_shadow" />
            <div className="a1" />
            <div className="a1d" />
            <div className="a2" />
            <div className="a2d" />
          </div>

          <div className="tv">
            <div className="display_div">
              <div className="screen_out">
                <div className="screen_out1">
                  <div className="screen">
                    <span className="notfound_text">{screenText}</span>
                  </div>
                  <div className="screenM">
                    <span className="notfound_text">{screenText}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="buttons_div">
              <div className="b1"><div /></div>
              <div className="b2" />
              <div className="speakers">
                <div className="g1">
                  <div className="g11" />
                  <div className="g12" />
                  <div className="g13" />
                </div>
                <div className="g" />
                <div className="g" />
              </div>
            </div>
          </div>

          <div className="bottom">
            <div className="base1" />
            <div className="base2" />
            <div className="base3" />
          </div>
        </div>

        <div className="text_404" aria-hidden="true">
          <span className="text_4041">{code[0]}</span>
          <span className="text_4042">{code[1]}</span>
          <span className="text_4043">{code[2]}</span>
        </div>
      </div>

      <div className="relative z-10 mt-6 max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
            >
              <RefreshCw className="size-4" /> Try again
            </button>
          ) : null}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

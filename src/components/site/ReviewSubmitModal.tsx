import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  X,
  Star,
  Type,
  Video,
  Upload,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { uploadsApi } from "@/lib/api-client";
import { useMyProfile } from "@/hooks/use-my-profile";
import {
  compressVideo,
  isCompressionSupported,
  MAX_DURATION_SEC,
  type CompressResult,
} from "@/lib/video-compress";
import { submitReview } from "@/lib/reviews.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

type Kind = "text" | "video";
type Step = "kind" | "compose" | "review" | "done";

export function ReviewSubmitModal({ open, onClose, onSubmitted }: Props) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/70 backdrop-blur-md"
      />
      <div className="relative mx-auto flex h-full w-full items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share your experience"
          className={`relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background text-foreground shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:rounded-3xl ${
            open ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet via-coral to-emerald" />

          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet">
                Verified review
              </p>
              <h2 className="font-display text-lg font-bold">Share your experience</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full border border-border bg-secondary transition-colors hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-8">
            {loading ? (
              <div className="grid place-items-center py-16 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : !user ? (
              <SignInPrompt onClose={onClose} />
            ) : (
              <SubmitFlow user={user} onClose={onClose} onSubmitted={onSubmitted} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SignInPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-soft text-violet">
        <ShieldCheck className="size-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold">Sign in to leave a review</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Reviews come only from real, signed-in customers. It keeps this wall honest — and yours
        recognisable.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/login"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
        >
          Sign in <ArrowRight className="size-4" />
        </Link>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function SubmitFlow({
  user,
  onClose,
  onSubmitted,
}: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const submitFn = submitReview;
  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<Kind>("text");

  const { data: profile } = useMyProfile();
  const metaName =
    (profile?.full_name as string | undefined) ||
    (user.user_metadata?.["full_name"] as string | undefined) ||
    (user.user_metadata?.["name"] as string | undefined) ||
    (user.email ? user.email.split("@")[0] : "");
  const [displayName, setDisplayName] = useState(metaName || "");
  // Keep the field synced when the profile updates in realtime (e.g. user
  // edits their name in another tab) as long as they haven't typed over it.
  useEffect(() => {
    if (!displayName || displayName === metaName) return;
  }, [displayName, metaName]);
  const [role, setRole] = useState("");
  const [country, setCountry] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressPct, setCompressPct] = useState(0);
  const [compressed, setCompressed] = useState<CompressResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canGoCompose = displayName.trim().length >= 2;
  const composeReady =
    kind === "text"
      ? body.trim().length >= 40 && rating >= 1
      : !!compressed && !compressing;

  async function handlePickVideo(file: File) {
    setError(null);
    if (!isCompressionSupported()) {
      setError("Your browser can't compress video. Try Chrome, Edge, or Firefox.");
      return;
    }
    setVideoFile(file);
    setCompressed(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCompressing(true);
    setCompressPct(0);
    try {
      const result = await compressVideo(file, setCompressPct);
      setCompressed(result);
      setPreviewUrl(URL.createObjectURL(result.video));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed.");
      setVideoFile(null);
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setUploading(true);
    try {
      let videoPath: string | null = null;
      let posterPath: string | null = null;

      if (kind === "video") {
        if (!compressed) throw new Error("Please add a video first.");
        const base = `${user.id}/${crypto.randomUUID()}`;
        const vPath = `${base}.${compressed.ext}`;
        const pPath = `${base}.jpg`;
        const up1 = await uploadsApi.upload("reviews", compressed.video, {
          path: vPath,
          contentType: compressed.mimeType,
        });
        const up2 = await uploadsApi.upload("reviews", compressed.poster, {
          path: pPath,
          contentType: "image/jpeg",
        });
        videoPath = up1.path;
        posterPath = up2.path;
      }

      await submitFn({
        data: {
          kind,
          rating,
          body: body.trim() || null,
          displayName: displayName.trim(),
          role: role.trim() || null,
          country: country.trim() || null,
          videoPath,
          videoPosterPath: posterPath,
          durationSec: compressed?.durationSec ?? null,
        },
      });

      onSubmitted?.();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald/10 text-emerald">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold">Thanks — we'll take it from here</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team reviews every submission for quality and authenticity before it goes live.
          You'll see your review on the wall once it's approved — usually the same day.
        </p>
        <button
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          Back to the site
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Stepper step={step} />

      {step === "kind" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <KindCard
              active={kind === "text"}
              icon={<Type className="size-5" />}
              title="Write a review"
              body="Share a short story about the results you got. Takes ~60 seconds."
              onClick={() => setKind("text")}
            />
            <KindCard
              active={kind === "video"}
              icon={<Video className="size-5" />}
              title="Record a video"
              body={`Up to ${MAX_DURATION_SEC}s. We compress it in your browser — high quality, small file.`}
              onClick={() => setKind("video")}
            />
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we credit you?"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
              maxLength={80}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Role / company (optional)
                </label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Founder, Acme"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Country (optional)
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
                  maxLength={60}
                />
              </div>
            </div>
          </div>

          <NavRow
            onBack={onClose}
            backLabel="Cancel"
            onNext={() => setStep("compose")}
            nextDisabled={!canGoCompose}
            nextLabel="Continue"
          />
        </div>
      )}

      {step === "compose" && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Rating
            </label>
            <RatingPicker value={rating} onChange={setRating} />
          </div>

          {kind === "text" ? (
            <div>
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Your review
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                minLength={40}
                maxLength={800}
                placeholder="What did EmailsLy help you do? Be specific — numbers and outcomes are gold."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Minimum 40 characters</span>
                <span>{body.length}/800</span>
              </div>
            </div>
          ) : (
            <VideoPicker
              file={videoFile}
              compressing={compressing}
              pct={compressPct}
              previewUrl={previewUrl}
              result={compressed}
              onPick={handlePickVideo}
              onClear={() => {
                setVideoFile(null);
                setCompressed(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            />
          )}

          {error && (
            <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <NavRow
            onBack={() => setStep("kind")}
            onNext={() => setStep("review")}
            nextDisabled={!composeReady}
            nextLabel="Review"
          />
        </div>
      )}

      {step === "review" && (
        <div className="mt-6 space-y-4">
          <ReviewPreview
            kind={kind}
            rating={rating}
            body={body}
            displayName={displayName}
            role={role}
            country={country}
            previewUrl={previewUrl}
          />

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 accent-violet"
            />
            <span className="text-muted-foreground">
              I confirm this review is my own honest experience and I allow EmailsLy to display it
              with the name shown above.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <NavRow
            onBack={() => setStep("compose")}
            onNext={handleSubmit}
            nextDisabled={!consent || uploading}
            nextLabel={uploading ? "Submitting…" : "Submit for review"}
          />
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ["kind", "compose", "review"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div
            className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
              i <= idx ? "bg-violet text-white" : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 ${i < idx ? "bg-violet" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function KindCard({
  active,
  icon,
  title,
  body,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-violet bg-violet-soft shadow-[0_10px_30px_-15px_rgba(124,92,255,0.5)]"
          : "border-border bg-card hover:border-violet/40"
      }`}
    >
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          active ? "bg-violet text-white" : "bg-violet-soft text-violet"
        }`}
      >
        {icon}
      </div>
      <div className="mt-3 font-display font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>
    </button>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`size-7 ${n <= value ? "fill-coral text-coral" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

function VideoPicker({
  file,
  compressing,
  pct,
  previewUrl,
  result,
  onPick,
  onClear,
}: {
  file: File | null;
  compressing: boolean;
  pct: number;
  previewUrl: string | null;
  result: CompressResult | null;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4">
      {!file && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-violet-soft text-violet">
            <Video className="size-5" />
          </div>
          <div>
            <div className="font-display font-semibold">Add a short video</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Up to {MAX_DURATION_SEC} seconds · MP4, MOV, WebM
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="video/*"
              capture="user"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              <Upload className="size-4" /> Upload file
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
            >
              <Camera className="size-4" /> Use camera
            </button>
          </div>
        </div>
      )}

      {file && compressing && (
        <div className="py-6 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-violet" />
          <div className="mt-3 font-display text-sm font-semibold">
            Compressing your video…
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Happens right in your browser — no upload yet.
          </div>
          <div className="mx-auto mt-4 h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-violet transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {file && !compressing && result && previewUrl && (
        <div>
          <video
            src={previewUrl}
            controls
            playsInline
            className="w-full rounded-xl bg-ink"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {result.width}×{result.height} · {result.durationSec}s ·{" "}
              {(result.video.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <button
              type="button"
              onClick={onClear}
              className="font-semibold text-foreground underline underline-offset-4 hover:text-violet"
            >
              Replace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewPreview({
  kind,
  rating,
  body,
  displayName,
  role,
  country,
  previewUrl,
}: {
  kind: Kind;
  rating: number;
  body: string;
  displayName: string;
  role: string;
  country: string;
  previewUrl: string | null;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card">
      {kind === "video" && previewUrl && (
        <video src={previewUrl} controls playsInline className="w-full bg-ink" />
      )}
      <div className="p-5">
        <div className="flex gap-0.5 text-coral">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${i < rating ? "fill-current" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        {body && (
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {kind === "text" ? body : `"${body}"`}
          </p>
        )}
        <div className="mt-4 border-t border-border pt-3">
          <div className="font-display text-sm font-semibold">{displayName || "Your name"}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {[role, country].filter(Boolean).join(" · ") || "Verified customer"}
          </div>
        </div>
      </div>
    </figure>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  backLabel = "Back",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  backLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

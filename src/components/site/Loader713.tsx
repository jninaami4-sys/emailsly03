import { EmailslyLoaderInline } from "./EmailslyLoaderInline";

/**
 * Legacy Loader713 API — now renders the unified EmailsLy loader visual
 * so every "loading" surface across the site shares one design.
 */
export function Loader713({
  label = "LOADING",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <EmailslyLoaderInline
      compact
      label={label}
      fill={false}
      className={className}
    />
  );
}

export function Loader713Panel({
  title,
  subtitle,
  chip: _chip,
  steps: _steps,
  systemLabel: _systemLabel,
  label = "LOADING",
}: {
  title?: string;
  subtitle?: string;
  chip?: string;
  steps?: string[];
  systemLabel?: string;
  label?: string;
}) {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-16">
      <EmailslyLoaderInline label={label} fill={false} />
      {(title || subtitle) && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          {title && (
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}

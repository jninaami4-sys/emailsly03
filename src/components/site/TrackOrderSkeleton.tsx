import { EmailslyLoaderInline } from "./EmailslyLoaderInline";

export function TrackOrderSkeleton() {
  return (
    <div className="min-h-screen">
      <EmailslyLoaderInline label="Loading tracker" />
    </div>
  );
}

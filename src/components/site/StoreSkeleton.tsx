import { EmailslyLoaderInline } from "./EmailslyLoaderInline";

export function StoreSkeleton() {
  return (
    <div className="min-h-screen">
      <EmailslyLoaderInline label="Loading store" />
    </div>
  );
}

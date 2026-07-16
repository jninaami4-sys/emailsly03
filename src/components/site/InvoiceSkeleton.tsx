import { EmailslyLoaderInline } from "./EmailslyLoaderInline";

export function InvoiceSkeleton() {
  return (
    <div className="min-h-screen">
      <EmailslyLoaderInline label="Loading invoice" />
    </div>
  );
}

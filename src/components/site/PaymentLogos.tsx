import { cn } from "@/lib/utils";

interface PaymentLogosProps {
  className?: string;
}

export function PaymentLogos({ className }: PaymentLogosProps) {
  const logos = [
    { label: "Stripe", src: "https://cdn.simpleicons.org/stripe/635BFF" },
    { label: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
    { label: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
    { label: "Apple Pay", src: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" },
    { label: "Binance", src: "https://cdn.simpleicons.org/binance/F0B90B" },
    { label: "Payoneer", src: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Payoneer-Logo.png" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {logos.map((logo) => (
        <div
          key={logo.label}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white px-3 transition-colors hover:bg-white/90"
          title={logo.label}
          aria-label={logo.label}
        >
          <img
            src={logo.src}
            alt={`${logo.label} logo`}
            className="h-5 w-auto max-w-[64px] object-contain"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type Variant = "verified" | "claimable" | "review" | "imported";

const styles: Record<Variant, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  claimable: "border-sky-200 bg-sky-50 text-sky-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  imported: "border-black/10 bg-white text-black/70",
};

export function BlupryntBadge({
  label,
  variant,
  className,
}: {
  label: string;
  variant: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em]",
        styles[variant],
        className,
      )}
    >
      <Image src="/logos/bluprynt.png" alt="" width={12} height={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

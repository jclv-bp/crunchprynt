import Link from "next/link";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";

type ReadinessStep = {
  label: string;
  description: string;
  status: "complete" | "in_progress" | "missing";
};

type TimelineItem = {
  title: string;
  body: string;
  date: Date;
  tone?: "default" | "accent" | "success";
};

const readinessTones = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-900",
  in_progress: "border-[#007BFF]/25 bg-[#007BFF]/8 text-[#005FCC]",
  missing: "border-black/10 bg-white text-black/72",
} as const;

const timelineTones = {
  default: "border-black/10 bg-white",
  accent: "border-[#007BFF]/18 bg-[#007BFF]/6",
  success: "border-emerald-200 bg-emerald-50/70",
} as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function scoreFromSteps(steps: ReadinessStep[]) {
  const earned = steps.reduce((sum, step) => {
    if (step.status === "complete") return sum + 1;
    if (step.status === "in_progress") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((earned / steps.length) * 100);
}

export function VerificationReadiness({
  title,
  intro,
  steps,
  titleId,
}: {
  title: string;
  intro: string;
  steps: ReadinessStep[];
  titleId?: string;
}) {
  const score = scoreFromSteps(steps);
  const completed = steps.filter((step) => step.status === "complete").length;

  return (
    <section className="border border-black/10 bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.15em] text-black/55">CLAIM READINESS</p>
          <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
          <p className="mt-3 text-sm leading-[1.7] text-black/68">{intro}</p>
        </div>
        <div className="min-w-[180px] border border-[#007BFF]/18 bg-[linear-gradient(180deg,rgba(0,123,255,0.12),rgba(255,255,255,0.98))] px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-black/55">READINESS SCORE</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#007BFF]">{score}%</p>
          <p className="mt-1 text-xs text-black/60">{completed} of {steps.length} checkpoints completed</p>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.label} className={`border p-4 ${readinessTones[step.status]}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{step.label}</h3>
              <span className="text-[10px] font-semibold tracking-[0.15em]">
                {step.status === "complete" ? "DONE" : step.status === "in_progress" ? "IN PROGRESS" : "NEXT"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-[1.6]">{step.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VerificationTimeline({
  title,
  intro,
  items,
  titleId,
}: {
  title: string;
  intro: string;
  items: TimelineItem[];
  titleId?: string;
}) {
  const sorted = [...items].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <section className="border border-black/10 bg-white p-6">
      <p className="text-xs font-semibold tracking-[0.15em] text-black/55">VERIFICATION TIMELINE</p>
      <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-[1.7] text-black/68">{intro}</p>

      <ol className="mt-6 space-y-3">
        {sorted.map((item) => (
          <li key={`${item.title}-${item.date.toISOString()}`} className={`border p-4 ${timelineTones[item.tone ?? "default"]}`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-[1.6] text-black/72">{item.body}</p>
              </div>
              <p className="text-xs font-semibold tracking-[0.15em] text-black/50">{formatDate(item.date)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DashboardPreview({
  title,
  intro,
  items,
  href,
  cta,
  titleId,
}: {
  title: string;
  intro: string;
  items: string[];
  href: string;
  cta: string;
  titleId?: string;
}) {
  return (
    <section className="border border-black/10 bg-[linear-gradient(180deg,rgba(0,123,255,0.05),rgba(255,255,255,1))] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold tracking-[0.15em] text-black/55">ISSUER DASHBOARD PREVIEW</p>
        <BlupryntBadge label="UNLOCK WITH CLAIM" variant="claimable" />
      </div>
      <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-[1.7] text-black/68">{intro}</p>

      <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="border border-black/10 bg-white px-4 py-3 text-sm text-black/75">
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={href}
          className="inline-flex min-h-12 items-center justify-center border border-[#007BFF] bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,123,255,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#006FE6]"
        >
          {cta}
        </Link>
        <Link
          href="/how-claiming-works"
          className="inline-flex min-h-12 items-center justify-center border border-[#007BFF]/18 bg-white px-5 py-3 text-sm font-medium text-[#007BFF] transition-colors hover:border-[#007BFF]/35"
        >
          Learn the process
        </Link>
      </div>
    </section>
  );
}

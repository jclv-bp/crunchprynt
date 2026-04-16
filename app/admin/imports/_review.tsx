"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityDiff } from "@/lib/esma/map";
import { commitImport, cancelPending } from "@/lib/esma/import";
import { ImportReviewTable } from "@/components/admin/import-review-table";

export function ImportReview({ pendingId, diffs }: { pendingId: string; diffs: EntityDiff[] }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState<Set<number>>(new Set(diffs.map((_, i) => i))); // default: accept all
  const [submitting, setSubmitting] = useState(false);

  function toggle(i: number) {
    setAccepted(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function onCommit() {
    setSubmitting(true);
    try {
      const res = await commitImport(pendingId, Array.from(accepted).sort((a, b) => a - b));
      router.push(`/admin/imports?batch=${res.batchId}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onCancel() {
    setSubmitting(true);
    try {
      await cancelPending(pendingId);
      router.push("/admin/imports");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ImportReviewTable diffs={diffs} accepted={accepted} onToggle={toggle} />

      <div className="mt-8 flex gap-4">
        <button onClick={onCommit} disabled={submitting}
          className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
          {submitting ? "COMMITTING…" : `COMMIT ${accepted.size} OF ${diffs.length}`}
        </button>
        <button onClick={onCancel} disabled={submitting}
          className="border border-black/10 text-black px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-surface transition-colors">
          CANCEL
        </button>
      </div>
    </>
  );
}

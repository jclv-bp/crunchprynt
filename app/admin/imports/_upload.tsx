"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewImport } from "@/lib/esma/import";

const fileTypes = [
  { value: "emt", label: "EMT issuers" },
  { value: "art", label: "ART issuers" },
  { value: "casp_authorized", label: "Authorised CASPs" },
  { value: "casp_noncompliant", label: "Non-compliant CASPs" },
  { value: "whitepapers", label: "White papers" },
] as const;

export function UploadPanel() {
  const router = useRouter();
  const [fileType, setFileType] = useState<(typeof fileTypes)[number]["value"]>("emt");
  const [reviewer, setReviewer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ row: number; message: string }[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setErrors(null);
    try {
      const csv = await file.text();
      const res = await previewImport(file.name, fileType, csv, reviewer);
      if (!res.ok) {
        setErrors(res.errors);
      } else {
        router.push(`/admin/imports?pending=${res.pendingId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const fieldCls = "w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30";
  const labelCls = "text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold";

  return (
    <form onSubmit={onSubmit} className="bg-white border border-black/10 p-8 max-w-[720px]">
      <div className="mb-6">
        <label className={labelCls}>FILE TYPE</label>
        <select value={fileType} onChange={e => setFileType(e.target.value as any)} className={fieldCls}>
          {fileTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="mb-6">
        <label className={labelCls}>REVIEWER</label>
        <input value={reviewer} onChange={e => setReviewer(e.target.value)}
          placeholder="Your name (stored on the import batch)"
          className={fieldCls} />
      </div>
      <div className="mb-6">
        <label className={labelCls}>CSV FILE</label>
        <input type="file" accept=".csv,text/csv"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm" />
        <p className="text-xs text-black/40 mt-2">
          Download sample fixtures from <span className="font-mono">/fixtures/esma-*-sample.csv</span>
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 mb-6 text-sm">
          <p className="text-xs tracking-[0.15em] font-semibold text-destructive mb-2">PARSE ERRORS</p>
          <ul className="text-red-900 space-y-1">
            {errors.slice(0, 20).map((e, i) => (
              <li key={i}>Row {e.row}: {e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={!file || !reviewer || submitting}
        className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
        {submitting ? "PARSING…" : "PREVIEW"}
      </button>
    </form>
  );
}

import { db } from "@/lib/db";
import { UploadPanel } from "./_upload";
import { ImportReview } from "./_review";

export default async function ImportsPage({ searchParams }: { searchParams: Promise<{ pending?: string; batch?: string }> }) {
  const { pending, batch } = await searchParams;

  if (batch) {
    const b = await db.importBatch.findUnique({ where: { id: batch } });
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-8">Import complete</h1>
        {b ? (
          <div className="bg-white border border-black/10 p-6 max-w-[720px]">
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">BATCH {b.id}</p>
            <p className="text-sm">
              File: <span className="font-mono">{b.fileName}</span><br/>
              Type: {b.esmaFileType}<br/>
              Reviewer: {b.reviewer}<br/>
              Rows confirmed: {b.rowsConfirmed}<br/>
              Rows rejected: {b.rowsRejected}
            </p>
            <a href="/admin/imports" className="text-accent-blue text-sm mt-6 inline-block hover:underline">← Run another import</a>
          </div>
        ) : (
          <p className="text-sm text-black/60">Batch not found.</p>
        )}
      </>
    );
  }

  if (pending) {
    const p = await db.pendingImport.findUnique({ where: { id: pending } });
    if (!p) return <p className="text-sm text-black/60">Pending import not found. <a href="/admin/imports" className="text-accent-blue hover:underline">Start over.</a></p>;
    const diffs = JSON.parse(p.diffsJson);
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">Reconciliation preview</h1>
        <p className="text-black/60 mb-8">
          File: <span className="font-mono">{p.fileName}</span> · Type: <span className="font-mono">{p.esmaFileType}</span> · Reviewer: {p.reviewer}
        </p>
        <ImportReview pendingId={p.id} diffs={diffs} />
      </>
    );
  }

  const recentBatches = await db.importBatch.findMany({ orderBy: { importedAt: "desc" }, take: 5 });
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">MiCA CSV import</h1>
      <p className="text-black/60 mb-8">
        Upload a CSV from the ESMA interim register. The importer will parse, reconcile against the current registry, and show a preview. Nothing is persisted until you confirm.
      </p>
      <UploadPanel />
      {recentBatches.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">RECENT IMPORTS</h2>
          <div className="bg-white border border-black/10 divide-y divide-black/5">
            {recentBatches.map(b => (
              <div key={b.id} className="px-6 py-4 text-sm flex flex-wrap justify-between gap-2">
                <span className="font-mono">{b.fileName}</span>
                <span className="text-black/60">{b.esmaFileType}</span>
                <span>✓ {b.rowsConfirmed} · ✗ {b.rowsRejected}</span>
                <span className="text-black/40 text-xs">{b.importedAt.toISOString().slice(0, 10)} · {b.reviewer}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

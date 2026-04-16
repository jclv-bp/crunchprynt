export function CountRollup({ items }: { items: { label: string; value: string }[] }) {
  return (
    <p className="text-sm text-black/70 mb-8 leading-[1.6] tracking-[0.08em] font-semibold">
      {items.map((i, idx) => (
        <span key={i.label}>
          {idx > 0 && <span className="mx-3 text-black/30"> · </span>}
          {`${i.value} ${i.label.toUpperCase()}`}
        </span>
      ))}
    </p>
  );
}

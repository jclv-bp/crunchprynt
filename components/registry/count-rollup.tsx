export function CountRollup({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-8 mb-8">
      {items.map(i => (
        <div key={i.label}>
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">{i.label.toUpperCase()}</p>
          <p className="text-2xl font-semibold mt-1">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

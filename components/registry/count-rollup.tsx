export function CountRollup({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border border-black/10 bg-white p-5">
          <dt className="text-xs font-semibold tracking-[0.15em] text-black/55">{item.label.toUpperCase()}</dt>
          <dd className="mt-2 text-lg font-semibold tracking-[-0.02em] text-black">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

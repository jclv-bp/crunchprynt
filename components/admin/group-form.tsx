import { createGroup, updateGroup } from "@/app/admin/_actions";

type Initial = {
  id: string; slug: string; displayName: string; description: string;
  website: string | null; commentary: string | null; logoPath: string | null;
};

export function GroupForm({ initial }: { initial?: Initial }) {
  const action = initial
    ? updateGroup.bind(null, initial.id)
    : createGroup;
  const fields: Array<[string, string, string]> = [
    ["slug", "SLUG", initial?.slug ?? ""],
    ["displayName", "DISPLAY NAME", initial?.displayName ?? ""],
    ["description", "DESCRIPTION", initial?.description ?? ""],
    ["website", "WEBSITE", initial?.website ?? ""],
    ["logoPath", "LOGO PATH (e.g. /logos/circle.png)", initial?.logoPath ?? ""],
  ];
  return (
    <form action={action as any} className="bg-white border border-black/10 p-8 max-w-[720px]">
      {fields.map(([name, label, value]) => (
        <div key={name} className="mb-6">
          <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>
          <input name={name} defaultValue={value}
            className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
        </div>
      ))}
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">COMMENTARY (WRITTEN BY BLUPRYNT)</label>
        <textarea name="commentary" defaultValue={initial?.commentary ?? ""} rows={6}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <button type="submit" className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors">
        {initial ? "SAVE" : "CREATE GROUP"}
      </button>
    </form>
  );
}

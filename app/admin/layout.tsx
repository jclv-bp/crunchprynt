import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const nav: Array<[string, string]> = [
    ["/admin", "Overview"],
    ["/admin/groups", "Groups"],
    ["/admin/entities", "Entities"],
    ["/admin/assets", "Assets"],
    ["/admin/imports", "MiCA import"],
  ];
  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] bg-primary text-white/80 p-6 flex flex-col gap-2">
        <div className="text-xs tracking-[0.15em] font-semibold text-white mb-6">BLUPRYNT · ADMIN</div>
        {nav.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="text-sm px-3 py-2 hover:bg-white/10 hover:text-white transition-colors"
          >
            {label}
          </Link>
        ))}
        <Link href="/" className="text-xs tracking-[0.15em] text-white/40 mt-auto hover:text-white">
          ← PUBLIC SITE
        </Link>
      </aside>
      <main className="flex-1 bg-surface p-8 min-w-0">{children}</main>
    </div>
  );
}

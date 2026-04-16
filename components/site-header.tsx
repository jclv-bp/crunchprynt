import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logos/bluprynt.png" alt="Bluprynt" width={28} height={28} />
          <span className="text-sm tracking-[0.15em] font-semibold">BLUPRYNT · VERIFIED REGISTRY</span>
        </Link>
        <nav className="flex gap-8 text-sm">
          <Link href="/data-sources" className="text-black/60 hover:text-black">Data sources</Link>
          <Link href="/how-claiming-works" className="text-black/60 hover:text-black">How claiming works</Link>
        </nav>
      </div>
    </header>
  );
}

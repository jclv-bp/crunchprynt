import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 bg-white/95 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto flex min-h-16 flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <Link
          href="/"
          aria-label="Bluprynt Verified Registry home"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Image src="/logos/bluprynt.png" alt="Bluprynt" width={28} height={28} />
          <span className="text-sm tracking-[0.15em] font-semibold">BLUPRYNT · VERIFIED REGISTRY</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-6 text-sm">
          <Link
            href="/data-sources"
            className="text-black/70 underline-offset-4 transition-colors hover:text-black hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Data sources
          </Link>
          <Link
            href="/how-claiming-works"
            className="text-black/70 underline-offset-4 transition-colors hover:text-black hover:underline focus-visible:outline-none focus-visible:underline"
          >
            How claiming works
          </Link>
        </nav>
      </div>
    </header>
  );
}

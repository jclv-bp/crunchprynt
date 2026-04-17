"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OutlineItem = {
  id: string;
  label: string;
};

export function PageOutline({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow?: string;
  items: OutlineItem[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => !!section);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.3, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="top-24 border border-black/10 bg-white p-5 lg:sticky">
      {eyebrow ? <p className="text-xs font-semibold tracking-[0.15em] text-black/50">{eyebrow}</p> : null}
      <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      <nav aria-label={`${title} sections`} className="mt-5">
        <ul className="space-y-2">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <Link
                  href={`#${item.id}`}
                  aria-current={active ? "location" : undefined}
                  className={`block border-l-2 pl-3 text-sm transition-colors ${
                    active
                      ? "border-accent-blue text-black"
                      : "border-black/10 text-black/60 hover:border-black/30 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

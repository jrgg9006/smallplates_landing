"use client";

import { useEffect, useState } from "react";

interface JumpNavSection {
  id: string;
  title: string;
}

export default function JumpNav({ sections }: { sections: JumpNavSection[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Reason: highlight the category currently in the upper band of the
    // viewport; margins make exactly one section "active" at a time.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -75% 0px" }
    );
    // Reason: the observer only fires on scroll, so highlight the first
    // section on load instead of showing no active pill at the top.
    if (sections.length > 0) setActiveId(sections[0].id);
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="FAQ sections"
      className="-mx-6 mb-8 overflow-x-auto px-6 lg:sticky lg:top-28 lg:mx-0 lg:mb-0 lg:overflow-visible lg:px-0"
    >
      <p className="type-eyebrow mb-4 hidden lg:block">Jump to a section</p>
      <ul className="flex gap-2 lg:flex-col">
        {sections.map(({ id, title }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              className={`inline-block whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors lg:block lg:w-full ${
                activeId === id
                  ? "border-brand-charcoal bg-brand-charcoal text-white"
                  : "border-brand-sand bg-white text-brand-charcoal hover:border-brand-charcoal/40"
              }`}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

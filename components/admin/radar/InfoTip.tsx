'use client';

// Reason: every Radar metric carries its exact definition — "nada ambiguo".
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-block align-middle">
      <span className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-500">
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-60 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-lg group-hover/tip:block">
        {text}
      </span>
    </span>
  );
}

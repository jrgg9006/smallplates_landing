import Image from "next/image";

function AnimatedDots() {
  return (
    <span className="inline-flex gap-[2px] ml-[1px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
        >
          .
        </span>
      ))}
    </span>
  );
}

interface BrandLoaderProps {
  message?: string;
  // Reason: fixed=true renders as a full-screen overlay (z-50) for in-page loading
  // states layered above existing content. Default is the standalone min-h-screen page.
  fixed?: boolean;
}

export default function BrandLoader({
  message = "One moment",
  fixed = false,
}: BrandLoaderProps) {
  const containerClass = fixed
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
    : "min-h-screen flex flex-col items-center justify-center gap-4";

  return (
    <div className={containerClass} style={{ background: "#FAF8F4" }}>
      <Image
        src="/images/SmallPlates_logo_horizontal.png"
        alt="Small Plates & Co."
        width={160}
        height={40}
        className="h-auto opacity-80"
      />
      <p className="text-sm tracking-wide" style={{ color: "rgba(45,45,45,0.4)" }}>
        {message}
        <AnimatedDots />
      </p>
    </div>
  );
}

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  "data-cta"?: string;
}

export default function CTAButton({
  label = "Let's do it",
  className = "",
  ...props
}: CTAButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-cta={props["data-cta"] ?? "hero-primary"}
      className={`inline-flex items-center justify-center rounded-2xl bg-black text-white px-6 py-3 text-base font-semibold shadow-sm hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}

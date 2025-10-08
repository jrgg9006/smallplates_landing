interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  "data-cta"?: string;
  onClick?: () => void;
}

export default function CTAButton({
  label = "Let's do it",
  className = "",
  onClick,
  ...props
}: CTAButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-cta={props["data-cta"] ?? "hero-primary"}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl bg-white text-black px-8 py-4 text-xl font-semibold shadow-sm hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white transition-colors ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}

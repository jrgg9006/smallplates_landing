import * as React from "react";

type CTAButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  "data-cta"?: string;
};

export default function CTAButton({
  label = "Add your Small Plate",
  className = "",
  ...props
}: CTAButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-cta={props["data-cta"] ?? "hero-primary"}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}

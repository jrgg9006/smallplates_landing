import { motion } from "framer-motion";

interface CTAButtonProps {
  label?: string;
  "data-cta"?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function CTAButton({
  label = "Create your Cookbook",
  className = "",
  onClick,
  "data-cta": dataCta = "hero-primary",
  disabled = false
}: CTAButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      data-cta={dataCta}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl bg-white text-black px-8 py-4 text-xl font-semibold shadow-sm hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}

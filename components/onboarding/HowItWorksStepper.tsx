import Image from "next/image";

interface Step {
  // Reason: image is optional so steps without final art render an empty slot
  // (no broken/404 image) until the SVG is dropped into /public.
  image?: string;
  alt?: string;
  text: string;
}

const STEPS: Step[] = [
  {
    text: "Share one link. Everyone sends their recipe there.",
  },
  {
    text: "No photos needed. We create an image for every recipe and design the whole book.",
  },
  {
    text: "You review every page before anything prints. Free until then.",
  },
  {
    text: "Your hardcover cookbook arrives at your door.",
  },
];

// Reason: icon centers sit at x≈120 (left) and x≈330 (right) within the 448px
// (max-w-md) column. The connector curves from the current step's icon side to
// the next step's icon side, producing the alternating "path" down the column.
const PATH_FROM_LEFT = "M120,2 C120,34 330,14 330,46";
const PATH_FROM_RIGHT = "M330,2 C330,34 120,14 120,46";

export function HowItWorksStepper({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full max-w-md ${className}`}>
      {STEPS.map((step, i) => {
        // Reason: even-indexed steps (2nd, 4th) mirror to the right so the
        // illustration alternates sides down the column.
        const flip = i % 2 === 1;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={i}>
            <div
              className={`flex items-center gap-4 ${
                flip ? "flex-row-reverse justify-end text-right" : "justify-start"
              }`}
            >
              {/* Reason: the slot only renders when the step has final art —
                  an empty 84px box misaligns the text and reads as broken. */}
              {step.image && (
                <div className="flex-none w-[84px] h-[84px]">
                  <Image
                    src={step.image}
                    alt={step.alt ?? ""}
                    width={84}
                    height={84}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <p className="font-serif text-[17px] lg:text-[19px] leading-relaxed text-gray-800 max-w-[14rem]">
                {step.text}
              </p>
            </div>

            {!isLast && (
              <div className="h-16" aria-hidden="true">
                <svg
                  viewBox="0 0 448 48"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <path
                    d={flip ? PATH_FROM_RIGHT : PATH_FROM_LEFT}
                    fill="none"
                    stroke="#C2AE84"
                    strokeWidth="2"
                    strokeDasharray="2 9"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

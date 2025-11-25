import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export default function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <h3 className="font-sans font-semibold text-base md:text-lg leading-[120%] text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="font-sans font-normal text-sm md:text-[15px] leading-[150%] text-[#6F6F6F] mt-0.5">
        {description}
      </p>

      {/* Image - pushed to bottom with spacing and hover animation */}
      <div className="mt-auto pt-3 md:pt-4">
        <div className="w-full max-w-[80%] mx-auto rounded-xl overflow-hidden shadow-sm transition-transform duration-300 ease-out hover:scale-105 hover:shadow-md cursor-pointer">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={450}
            className="w-full h-auto rounded-xl transition-transform duration-300 ease-out"
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 30vw"
          />
        </div>
      </div>
    </div>
  );
}


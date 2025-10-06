import Image from "next/image";

export default function Banner() {
  return (
    <header
      role="banner"
      aria-label="Top banner"
      className="w-full bg-white border-b border-gray-100"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-center">
        <Image
          src="/images/SmallPlates_logo_horizontal.png"
          alt="Small Plates & Company"
          width={200}
          height={40}
          priority
        />
      </div>
    </header>
  );
}

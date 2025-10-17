import Image from "next/image";

export default function TextSection() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Main headline */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight mb-12">
            We believe people<br />
            connect through Food
          </h1>
          
          {/* Subheading */}
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium text-gray-900">
              That&apos;s why we created<br />
              Small Plates & Co.
            </h2>
          </div>
          
          {/* Beautiful Plate Image */}
          <div className="relative w-full max-w-md mx-auto mb-12">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="/images/other/plato_1.jpg"
                alt="Artisanal ceramic plate"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
              {/* Subtle gradient only at the very edge */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
            </div>
            {/* Subtle shadow for depth */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-gradient-to-b from-gray-100/10 to-transparent rounded-[50%] blur-2xl"></div>
          </div>
          
          {/* Decorative line */}
          <div className="mb-12">
            <div className="w-32 h-0.5 bg-gray-900 mx-auto"></div>
          </div>
          
          {/* Description paragraph */}
          <div className="max-w-2xl mx-auto">
            <p className="font-sans text-lg md:text-xl lg:text-2xl text-gray-900 leading-relaxed">
              To capture the feeling of connection<br />
              that only food can create.<br />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
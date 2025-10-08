import Image from "next/image";

export default function CookbookShowcase() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left column - Book image */}
            <div className="relative">
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto">
                <Image
                  src="/images/book_placeholder.png"
                  alt="Cookbook preview showing recipe pages"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            {/* Right column - Text */}
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 leading-tight">
                Turn them<br />
                into a beautiful<br />
                Hardcover<br />
                Cookbook
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
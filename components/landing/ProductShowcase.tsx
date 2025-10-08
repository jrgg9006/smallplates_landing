import Image from "next/image";

export default function ProductShowcase() {
  return (
    <section aria-labelledby="product-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 id="product-title" className="text-2xl md:text-3xl font-semibold text-gray-900">
          Your keepsake cookbook
        </h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <figure className="w-full relative aspect-[4/5]">
            <Image
              src="/images/book-mockup.svg"
              alt="Hardcover cookbook mockup"
              fill
              className="object-contain rounded-2xl"
            />
          </figure>

          <div>
            <ul className="space-y-3 text-lg text-gray-800">
              <li>High quality</li>
              <li>Hardcover</li>
              <li>Premium print</li>
              <li>Keepsake</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

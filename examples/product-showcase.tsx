import * as React from "react";

export default function ProductShowcase() {
  return (
    <section aria-labelledby="product-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 id="product-title" className="text-2xl md:text-3xl font-semibold">
          Your keepsake cookbook
        </h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <figure className="w-full">
            <img
              src="/images/book-mockup.jpg"
              alt="Hardcover cookbook mockup"
              className="w-full rounded-2xl shadow-sm"
            />
          </figure>

          <div>
            <ul className="space-y-2 text-gray-800">
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

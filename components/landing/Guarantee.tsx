export default function Guarantee() {
  const testimonials = [
    {
      id: 1,
      quote: "Great experience, very helpful and my album turned out gorgeous.",
      author: "ABIGAIL D.",
      company: "DESIGN SERVICES CLIENT"
    },
    {
      id: 2,
      quote: "We are so thankful for the memories and will treasure this album forever.",
      author: "DIANE H.",
      company: "SIGNATURE LAYFLAT PHOTO ALBUM"
    },
    {
      id: 3,
      quote: "An easy and fun way to display your favorite photos.",
      author: "HANNAH K.",
      company: "GALLERY FRAMES IN MAPLE FINISH"
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center">
          {/* Main heading */}
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-8">
            Our Guarantee
          </h2>
          
          {/* Subheading */}
          <p className="font-serif text-xl md:text-2xl text-gray-900 mb-16">
            
          </p>
          
          {/* Testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="text-center">
                {/* Large quotation marks */}
                <div className="font-serif text-6xl md:text-7xl text-gray-900 mb-6">&ldquo;</div>
                
                {/* Quote text */}
                <p className="font-serif text-lg md:text-xl text-gray-900 mb-8 px-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                
                {/* Author */}
                <p className="text-sm font-semibold tracking-wide text-gray-900 mb-1">
                  — {testimonial.author}
                </p>
                
                {/* Company/Product */}
                <p className="text-xs uppercase tracking-wider text-gray-600">
                  {testimonial.company}
                </p>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-4 text-sm uppercase tracking-wider font-semibold hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors"
          >
            SEE OUR QUALITY GUARANTEE
          </button>
        </div>
      </div>
    </section>
  );
}
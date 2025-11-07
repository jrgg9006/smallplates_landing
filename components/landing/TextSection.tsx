export default function TextSection() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Main headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-6xl font-bold text-gray-900 leading-tight mb-12">
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
          
          {/* Decorative line */}
          <div className="mb-8">
            <div className="w-32 h-0.5 bg-gray-900 mx-auto"></div>
          </div>
          
          {/* Description paragraph */}
          <div className="max-w-2xl mx-auto">
            <p className="font-sans font-light text-lg md:text-xl lg:text-2xl text-gray-900 leading-relaxed">
              to capture the feeling of connection<br />
              that only food can create.<br />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
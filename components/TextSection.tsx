export default function TextSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left column */}
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                Gather recipes<br />
                that tell stories
              </h2>
            </div>
            
            {/* Right column */}
            <div>
              <p className="font-sans text-lg md:text-xl text-gray-700">
                Share food in a unique way. Food that tell stories. Food with meaning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
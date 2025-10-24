export default function WhatsIncluded() {
  // Features organized in two columns
  const leftFeatures = [
    "1 Hardcover Cookbook Credit",
    "30-day money back guarantee", 
    "Smart tools to collect recipes",
  ];

  const rightFeatures = [
    "Up to 120 recipes",
    "Professional photo layout for each recipe",
    "Free shipping in the US",
  ];

  return (
    <section className="bg-smallplates_green py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* Left Content Section */}
          <div className="lg:col-span-1">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-4xl lg:text-5xl font-medium text-white mb-4 leading-tight">
              What&apos;s included in your Small Plates & Co. experience?
            </h2>
            <p className="text-lg md:text-xl text-emerald-100 mb-10 leading-relaxed">
              
            </p>
            
            {/* CTA Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-smallplates_red text-white px-8 py-4 text-lg font-semibold shadow-lg hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 transition-colors"
            >
              CREATE YOURS FOR $120
            </button>
          </div>

          {/* Right Features Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              
              {/* Left Features Column */}
              <div className="space-y-3">
                {leftFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {/* Checkmark Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <svg 
                        className="w-6 h-6 text-emerald-200" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    <span className="text-emerald-50 text-lg md:text-xl font-sans font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right Features Column */}
              <div className="space-y-3">
                {rightFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {/* Checkmark Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <svg 
                        className="w-6 h-6 text-emerald-200" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    <span className="text-emerald-50 text-lg md:text-xl font-sans font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
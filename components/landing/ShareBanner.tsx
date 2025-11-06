"use client";

import Image from "next/image";

export default function ShareBanner() {
  const shareIcons = [
    { id: 1, name: "WhatsApp", src: "/images/other/Icons_128x128/1.png" },
    { id: 2, name: "Email", src: "/images/other/Icons_128x128/2.png" },
    { id: 3, name: "SMS", src: "/images/other/Icons_128x128/3.png" },
    { id: 4, name: "Facebook", src: "/images/other/Icons_128x128/4.png" },
    { id: 5, name: "Link", src: "/images/other/Icons_128x128/5.png" },
  ];

  return (
    <section className="bg-white py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Text Column */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <h3 className="font-serif text-3xl md:text-4xl lg:text-4xl font-medium text-gray-900 mb-2">
              Collect recipes with one click
            </h3>
            <p className="text-lg md:text-xl text-gray-600 font-light">
              Your friends can easily submit recipes from any device.
            </p>
          </div>

          {/* Icons Column */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="flex items-center gap-4 md:gap-6">
              {shareIcons.map((icon, index) => (
                <div
                  key={icon.id}
                  className="share-icon opacity-0"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-300 hover:scale-110 cursor-pointer">
                    <Image
                      src={icon.src}
                      alt={`Share via ${icon.name}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Column */}
          <div className="lg:col-span-3 text-center lg:text-right">
            <div className="inline-block">
              <button 
                onClick={() => window.open('/preview-recipe-journey', '_blank')}
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-16 py-4 text-xl font-semibold shadow-sm hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-all duration-300 transform hover:scale-105 mb-2"
              >
                Preview
              </button>
              <p className="text-sm text-gray-500 font-light">
                See what your friends will receive
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        .share-icon {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
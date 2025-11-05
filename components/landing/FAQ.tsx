export default function FAQ() {
  const faqs = [
    {
      question: "How many recipes do I need to start my book?",
      answer: "You can start your book with as few as 20 recipes, though we recommend +30 for a balanced mix. The more recipes you collect, the richer and more personal your book becomes."
    },
    {
      question: "How can my guests send their recipes?",
      answer: "Each owner gets a personalized link to share — via WhatsApp, text, or email. Guests simply click the link, fill out a short form, and upload their recipe (and a photo, if they want!)."
    },
    {
      question: "How long does delivery take?",
      answer: "Once you've finished collecting and approve your final design, printing and delivery usually take 2-3 weeks depending on your location."
    },
    {
      question: "Can I include some of my own recipes too?",
      answer: "Of course. Think of it as your book, your story — made even better by the people you love."
    }
  ];

  return (
    <section id="faq" className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Section Title */}
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center font-medium text-gray-900 mb-16">
          Frequently Asked Questions
        </h2>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="font-serif text-xl md:text-2xl font-medium text-gray-900 mb-4">
                {faq.question}
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
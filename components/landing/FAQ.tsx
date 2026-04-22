import { motion } from "framer-motion";

export default function FAQ() {
  const faqs = [
    {
      question: "Do I need to upload a photo of the finished dish?",
      answer: "No. Just the recipe itself. We create every image for your book — that's what makes it cohesive and beautiful."
    },
    {
      question: "What if some guests don't cook?",
      answer: "Perfect. They can send a takeout order they'd die for. A sandwich they get every time. It's not about being a chef — it's about being in the book."
    },
    {
      question: "How long does it take?",
      answer: "Guests need about 5 minutes to submit. The whole process — from invites to printed book — takes 4-6 weeks."
    },
    {
      question: "Can I add recipes in any language?",
      answer: "Yes, you can add recipes in any language you want."
    },
    {
      question: "What if guests don't send their recipes?",
      answer: "Download your guest list from Zola or The Knot and send them a quick reminder. Most books end up with 30-50+ recipes. People want to be part of this."
    },
    {
      question: "Where do you ship?",
      answer: "United States, all of the European Union, and Mexico. Your book gets there."
    },
  ];

  return (
    <section id="faq" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Section Title */}
        <motion.h2 
          className="type-heading text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Questions?
        </motion.h2>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index} 
              className="border-b border-brand-sand pb-8 last:border-b-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1, 
                ease: "easeOut" 
              }}
            >
              <h3 className="type-subheading text-xl md:text-2xl mb-3">
                {faq.question}
              </h3>
              <p className="type-body-small">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
"use client";

import { motion } from "framer-motion";

export default function RegalosFAQ() {
  const faqs = [
    {
      question: "¿Tengo que cocinar yo?",
      answer:
        "No. El libro lo armamos nosotros. Usted no toca una sartén. Lo único que hace es invitar a la familia y a los amigos a mandar su receta favorita.",
    },
    {
      question: "¿Y si alguien de la familia no cocina?",
      answer:
        "Perfecto. Pueden mandar el platillo de un restaurante que les encanta. Una receta heredada que nunca aprendieron a hacer pero que recuerdan. Una bebida. No se trata de cocinar bien — se trata de estar en el libro.",
    },
    {
      question: "¿Cuánto tarda?",
      answer:
        "Cada persona se tarda como cinco minutos en mandar su receta. El proceso completo — desde que empezamos hasta que el libro llega a su casa — toma entre 4 y 6 semanas.",
    },
    {
      question: "¿Llega a México?",
      answer:
        "Sí. Mandamos a todo México. Le confirmamos los tiempos de envío por WhatsApp según la ciudad.",
    },
    {
      question: "¿En qué idioma se hace el libro?",
      answer:
        "En el que usted quiera. Cada quien manda su receta en español, inglés, o cómo prefiera. El libro puede ser todo en español, o mezclado — como sea más natural para la familia.",
    },
    {
      question: "¿Cuánto cuesta?",
      answer:
        "El libro principal para los novios cuesta $169 USD. Copias adicionales para quien quiera tener una, $129 USD cada una. El envío a México es gratis. Los detalles del costo total se los explicamos por WhatsApp para que sepa exactamente qué incluye.",
    },
    {
      question: "¿Pueden los novios no enterarse hasta el día?",
      answer:
        "Sí. Trabajamos con usted en privado. Los novios solo se enteran si usted los avisa, o el día que les entrega el libro. Si la familia y los amigos están al tanto del regalo, les pedimos discreción.",
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
          ¿Tiene dudas?
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
                ease: "easeOut",
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

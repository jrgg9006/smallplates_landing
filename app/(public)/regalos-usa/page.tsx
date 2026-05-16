import RegalosUSABanner from "./_components/RegalosUSABanner";
import RegalosUSAHero from "./_components/RegalosUSAHero";
import RegalosUSATheProblem from "./_components/RegalosUSATheProblem";
import RegalosUSATheSolution from "./_components/RegalosUSATheSolution";
import RegalosUSAHowItWorks from "./_components/RegalosUSAHowItWorks";
import RegalosUSAEasyToUse from "./_components/RegalosUSAEasyToUse";
import RegalosUSABooksPrinted from "./_components/RegalosUSABooksPrinted";
import RegalosUSAPersonalNotes from "./_components/RegalosUSAPersonalNotes";
import RegalosUSATheBook from "./_components/RegalosUSATheBook";
import RegalosUSATestimonialsSection from "./_components/RegalosUSATestimonialsSection";
import RegalosUSAEmotionalClose from "./_components/RegalosUSAEmotionalClose";
import RegalosUSAFAQ from "./_components/RegalosUSAFAQ";
import RegalosUSAFooter from "./_components/RegalosUSAFooter";
import RegalosUSAWhatsAppFAB from "./_components/RegalosUSAWhatsAppFAB";
import WhatsAppTracker from "@/components/analytics/WhatsAppTracker";

export const metadata = {
  title: "Small Plates — Un regalo que se cocina, no que se guarda",
  description:
    "Un libro de cocina con las recetas de su familia y de la gente cercana a los novios. Hecho a mano, tapa dura, listo para regalarse.",
  alternates: { canonical: "/regalos-usa" },
};

export default function RegalosUSAPage() {
  return (
    <>
      <WhatsAppTracker landing="regalos-usa" />
      <RegalosUSABanner />
      <main className="min-h-screen bg-white">
        <RegalosUSAHero />
        <RegalosUSATheProblem />
        <RegalosUSATheSolution />
        <RegalosUSAHowItWorks />
        <RegalosUSAEasyToUse />
        <RegalosUSABooksPrinted />
        <RegalosUSAPersonalNotes />
        <RegalosUSATheBook />
        <RegalosUSATestimonialsSection />
        <RegalosUSAEmotionalClose />
        <RegalosUSAFAQ />
      </main>
      <RegalosUSAFooter />
      <RegalosUSAWhatsAppFAB />
    </>
  );
}

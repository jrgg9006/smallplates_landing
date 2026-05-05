import RegalosBanner from "./_components/RegalosBanner";
import RegalosHero from "./_components/RegalosHero";
import RegalosTheProblem from "./_components/RegalosTheProblem";
import RegalosTheSolution from "./_components/RegalosTheSolution";
import RegalosHowItWorks from "./_components/RegalosHowItWorks";
import RegalosBooksPrinted from "./_components/RegalosBooksPrinted";
import RegalosPersonalNotes from "./_components/RegalosPersonalNotes";
import RegalosTheBook from "./_components/RegalosTheBook";
import RegalosTestimonialsSection from "./_components/RegalosTestimonialsSection";
import RegalosEmotionalClose from "./_components/RegalosEmotionalClose";
import RegalosFAQ from "./_components/RegalosFAQ";
import RegalosFooter from "./_components/RegalosFooter";

export const metadata = {
  title: "Small Plates — Un regalo que se cocina, no que se guarda",
  description:
    "Un libro de cocina con las recetas de su familia y de la gente cercana a los novios. Hecho a mano, tapa dura, listo para regalarse.",
};

export default function RegalosPage() {
  return (
    <>
      <RegalosBanner />
      <main className="min-h-screen bg-white">
        <RegalosHero />
        <RegalosTheProblem />
        <RegalosTheSolution />
        <RegalosHowItWorks />
        <RegalosBooksPrinted />
        <RegalosPersonalNotes />
        <RegalosTheBook />
        <RegalosTestimonialsSection />
        <RegalosEmotionalClose />
        <RegalosFAQ />
      </main>
      <RegalosFooter />
    </>
  );
}

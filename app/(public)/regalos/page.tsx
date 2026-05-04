import RegalosBanner from "./_components/RegalosBanner";
import RegalosHero from "./_components/RegalosHero";
import RegalosTheProblem from "./_components/RegalosTheProblem";
import RegalosTheSolution from "./_components/RegalosTheSolution";
import RegalosHowItWorks from "./_components/RegalosHowItWorks";
import RegalosBooksPrinted from "./_components/RegalosBooksPrinted";
import RegalosPersonalNotes from "./_components/RegalosPersonalNotes";
import RegalosTheBook from "./_components/RegalosTheBook";
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
        {/* Sections will be added in Phase 2D */}
        <div className="py-32 text-center">
          <p className="type-caption text-brand-charcoal/40">
            Construyendo /regalos — más secciones llegan pronto.
          </p>
        </div>
      </main>
      <RegalosFooter />
    </>
  );
}

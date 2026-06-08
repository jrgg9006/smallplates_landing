import { Metadata } from "next";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import PricingPage from "@/components/pricing/PricingPage";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";

export const metadata: Metadata = {
  title: "Pricing — Small Plates & Co.",
  description:
    "One book. Or one for everyone. Each person who chips in gets their own copy — the more you print, the less each one costs.",
};

export default function Pricing() {
  return (
    <>
      <Banner theme="light" showShippingStrip={false} />
      <PricingPage />
      <Footer />
      <WhatsAppFAB />
    </>
  );
}

import { Metadata } from "next";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import PricingPage from "@/components/pricing/PricingPage";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";

export const metadata: Metadata = {
  title: "Pricing — Small Plates & Co.",
  description:
    "One book. Everything included. First book $169, additional copies $129 each.",
};

export default function Pricing() {
  return (
    <>
      <Banner />
      <PricingPage />
      <Footer />
      <WhatsAppFAB />
    </>
  );
}

import { Metadata } from "next";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import PricingPage from "@/components/pricing/PricingPage";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";

export const metadata: Metadata = {
  title: "Pricing — Small Plates & Co.",
  description:
    "Free to start. Pay when it prints: one hardcover recipe book written by your people, and the price per person drops the more copies you print together.",
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

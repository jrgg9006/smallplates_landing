import { Metadata } from "next";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import PricingPage from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Pricing — Small Plates & Co.",
  description:
    "Three ways to give a wedding cookbook made by the guests. Books start at $149.",
};

export default function Pricing() {
  return (
    <>
      <Banner />
      <PricingPage />
      <Footer />
    </>
  );
}

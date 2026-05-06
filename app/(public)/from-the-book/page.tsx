import { Suspense } from "react";
import FromTheBookClient from "./FromTheBookClient";

export const metadata = {
  title: "Small Plates — Make one for your people",
  description:
    "A cookbook written by everyone who comes to the wedding. One recipe each. Bound, hardcover, ready to live in a kitchen.",
};

export default function FromTheBookPage() {
  return (
    <Suspense fallback={null}>
      <FromTheBookClient />
    </Suspense>
  );
}

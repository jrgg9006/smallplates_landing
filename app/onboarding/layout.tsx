import { isFreeTierEnabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { OnboardingHeaderClient } from "@/components/onboarding/OnboardingHeader";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!isFreeTierEnabled()) {
    redirect("/");
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={200}
              height={40}
              priority
            />
          </Link>
          <OnboardingHeaderClient />
        </div>
      </header>
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}

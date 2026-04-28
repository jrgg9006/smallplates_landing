import { Metadata } from "next";
import Image from "next/image";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import CopyOrderClient from "./CopyOrderClient";

interface BookData {
  id: string;
  title: string;
  bookStatus: string;
  closeDate: string | null;
  coverPhotoUrl: string | null;
  recipeCount: number;
  contributorCount: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: book } = await supabase
    .from("groups")
    .select("name")
    .eq("id", bookId)
    .single();

  return {
    title: book ? `Order a copy — ${book.name} | Small Plates & Co.` : "Small Plates & Co.",
  };
}

export default async function CopyPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: book } = await supabase
    .from("groups")
    .select("id, name, book_status, book_close_date, book_closed_by_user, couple_image_url")
    .eq("id", bookId)
    .single();

  // Reason: book_closed_by_user (timestamp) is the real indicator that a book was closed, not book_status
  if (!book || !book.book_closed_by_user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6">
        <Image
          src="/images/SmallPlates_logo_horizontal.png"
          alt="Small Plates & Co."
          width={200}
          height={40}
          priority
        />
        <p className="text-[15px] text-[hsl(var(--brand-warm-gray))] mt-8 text-center">
          This link is no longer available.
        </p>
      </div>
    );
  }

  const { count: recipeCount } = await supabase
    .from("guest_recipes")
    .select("id", { count: "exact", head: true })
    .eq("group_id", bookId);

  const { data: contributors } = await supabase
    .from("guest_recipes")
    .select("guest_id")
    .eq("group_id", bookId)
    .not("guest_id", "is", null);

  const uniqueContributors = new Set(contributors?.map((r) => r.guest_id));

  const bookData: BookData = {
    id: book.id,
    title: book.name,
    bookStatus: book.book_status,
    closeDate: book.book_close_date,
    coverPhotoUrl: book.couple_image_url,
    recipeCount: recipeCount ?? 0,
    contributorCount: uniqueContributors.size,
  };

  return <CopyOrderClient book={bookData} />;
}

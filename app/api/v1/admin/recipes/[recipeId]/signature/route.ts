import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// POST: guarda la firma (PNG dataURL) de una receta en el bucket `recipes`
// y persiste la URL pública en guest_recipes.signature_url.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    await requireAdminAuth();
    const { recipeId } = await params;

    const body = await req.json().catch(() => null);
    const dataUrl: unknown = body?.dataUrl;

    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "Se esperaba un PNG en base64 (dataUrl)" },
        { status: 400 }
      );
    }

    const base64 = dataUrl.replace("data:image/png;base64,", "");
    const buffer = Buffer.from(base64, "base64");

    const supabase = createSupabaseAdminClient();

    // Necesitamos user_id + guest_id para construir la ruta (misma convención
    // que los originales: users/{userId}/guests/{guestId}/recipes/{recipeId}/...).
    const { data: recipe, error: recipeError } = await supabase
      .from("guest_recipes")
      .select("user_id, guest_id")
      .eq("id", recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }

    const path = `users/${recipe.user_id}/guests/${recipe.guest_id}/recipes/${recipeId}/signature.png`;

    const { error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true, // re-firmar reemplaza la anterior
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("recipes").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("guest_recipes")
      .update({ signature_url: publicUrl })
      .eq("id", recipeId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ signature_url: publicUrl });
  } catch (error) {
    console.error("Error saving signature:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

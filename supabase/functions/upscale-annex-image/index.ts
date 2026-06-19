import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================
// Small Plates & Co. — Originals annex upscaling
// Twin of `upscale-image`, adapted to recipe_annex_images.
// Triggered by a Database Webhook on recipe_annex_images when
// upscale_status transitions to 'pending'.
// ============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;

const UPSCALE_FACTOR = 4;
const REPLICATE_MODEL_VERSION =
  "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  let rowId: string | null = null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    rowId = record.id as string;
    const status = (record.upscale_status as string | null) ?? null;
    const originalUrl = (record.original_url as string | null) ?? null;
    const groupId = record.group_id as string;
    const recipeId = record.recipe_id as string;
    const position = (record.position as number) ?? 0;

    console.log(`Webhook: ${payload.type} annex row ${rowId} (status=${status})`);

    // Reason: only act on the pending transition; ignore our own processing/ready writes
    // (this Edge Function itself updates the row, which re-fires the webhook).
    if (status !== "pending") {
      return jsonResponse({ skipped: true, reason: "not_pending" });
    }
    if (!originalUrl) {
      await supabase
        .from("recipe_annex_images")
        .update({ upscale_status: "error", image_dimensions: { error: "missing original_url" } })
        .eq("id", rowId);
      return jsonResponse({ skipped: true, reason: "no_original_url" });
    }

    await supabase
      .from("recipe_annex_images")
      .update({ upscale_status: "processing", print_url: null })
      .eq("id", rowId);

    console.log(`  Source (normalized): ${originalUrl}`);
    console.log(`  Sending to Real-ESRGAN (${UPSCALE_FACTOR}x)...`);
    const upscaledUrl = await callReplicate(originalUrl);
    console.log(`  Upscale complete`);

    const imageResponse = await fetch(upscaledUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download upscaled image: ${imageResponse.status}`);
    }
    const imageData = new Uint8Array(await imageResponse.arrayBuffer());
    console.log(`  Downloaded: ${(imageData.length / 1024 / 1024).toFixed(1)} MB`);

    const { width: newWidth, height: newHeight } = readImageDimensions(imageData);
    const origWidth = Math.round(newWidth / UPSCALE_FACTOR);
    const origHeight = Math.round(newHeight / UPSCALE_FACTOR);
    console.log(`  Dimensions: ${origWidth}x${origHeight} -> ${newWidth}x${newHeight}`);

    const printPath = `print/annex/${groupId}/${recipeId}_${position}.png`;
    console.log(`  Uploading to: recipes/${printPath}`);

    const { error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(printPath, imageData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const printUrl = `${SUPABASE_URL}/storage/v1/object/public/recipes/${printPath}`;

    const dimensions = {
      width: newWidth,
      height: newHeight,
      original_width: origWidth,
      original_height: origHeight,
      upscaled: true,
      upscale_factor: UPSCALE_FACTOR,
    };

    await supabase
      .from("recipe_annex_images")
      .update({
        print_url: printUrl,
        upscale_status: "ready",
        image_dimensions: dimensions,
      })
      .eq("id", rowId);

    console.log(`Done: annex row ${rowId} -> ${newWidth}x${newHeight}`);
    return jsonResponse({ success: true, id: rowId, print_url: printUrl, dimensions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error: ${msg}`);

    if (rowId) {
      try {
        await supabase
          .from("recipe_annex_images")
          .update({ upscale_status: "error", image_dimensions: { error: msg } })
          .eq("id", rowId);
      } catch {
        console.error("Failed to update error status");
      }
    }

    return jsonResponse({ error: msg }, 500);
  }
});

async function callReplicate(imageUrl: string): Promise<string> {
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: { image: imageUrl, scale: UPSCALE_FACTOR, face_enhance: false },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Replicate create failed (${createRes.status}): ${errText}`);
  }

  let prediction = await createRes.json();
  console.log(`  Prediction ID: ${prediction.id}`);

  let attempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    if (++attempts > MAX_POLL_ATTEMPTS) {
      throw new Error("Replicate timeout: exceeded 2 minutes");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } }
    );
    prediction = await pollRes.json();
    if (attempts % 5 === 0) {
      console.log(`  Waiting... (${prediction.status}, ${attempts * 2}s)`);
    }
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate failed: ${prediction.error}`);
  }

  return prediction.output as string;
}

function readImageDimensions(data: Uint8Array): { width: number; height: number } {
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    return { width, height };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset < data.length - 8) {
      if (data[offset] === 0xff) {
        const marker = data[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = (data[offset + 5] << 8) | data[offset + 6];
          const width = (data[offset + 7] << 8) | data[offset + 8];
          return { width, height };
        }
        const len = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + len;
      } else {
        offset++;
      }
    }
  }
  console.warn("Could not read image dimensions from header");
  return { width: 0, height: 0 };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

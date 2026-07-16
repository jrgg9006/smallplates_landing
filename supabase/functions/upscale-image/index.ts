import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================
// Small Plates & Co. — Auto Image Upscaling
// Triggered by Database Webhook on guest_recipes
// When a recipe has a generated image without a fresh print-ready
// version → upscale → save to /print/
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

  let recipeId: string | null = null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;
    const oldRecord = payload.old_record;

    recipeId = record.id as string;
    const recipeName = (record.recipe_name as string) || "Unknown";
    const newImageUrl = (record.generated_image_url as string) || null;
    const oldImageUrl = (oldRecord?.generated_image_url as string) || null;
    const printUrl = (record.generated_image_url_print as string) || null;
    const upscaleStatus = (record.image_upscale_status as string) || null;

    console.log(`Webhook: ${payload.type} on "${recipeName}" (${recipeId})`);

    // Reason: storage paths are DETERMINISTIC (generated/{groupId}/{recipeId}.png),
    // so replacing an image in place keeps the SAME URL string. We therefore cannot
    // use "URL changed" as the signal for "needs upscale" — that was leaving a STALE
    // print-ready image (the upscale of a previous image) whenever an image was
    // replaced or removed. Instead we (re)process whenever there is a source image
    // that has no fresh print-ready version yet. Operations clears print + status on
    // replace, which re-arms this. Guards below prevent no-op work and self-trigger
    // loops — this function updates the row twice, each re-firing the webhook.
    if (!newImageUrl) {
      console.log("Skip: no generated image");
      return jsonResponse({ skipped: true, reason: "no_image" });
    }
    if (upscaleStatus === "processing") {
      console.log("Skip: upscale already in progress");
      return jsonResponse({ skipped: true, reason: "in_progress" });
    }
    const urlChanged = newImageUrl !== oldImageUrl;
    const needsPrint = !printUrl;
    if (!urlChanged && !needsPrint) {
      console.log("Skip: print already up to date");
      return jsonResponse({ skipped: true, reason: "already_ready" });
    }

    await supabase
      .from("guest_recipes")
      .update({ image_upscale_status: "processing", generated_image_url_print: null })
      .eq("id", recipeId);

    console.log(`Processing: "${recipeName}"`);
    console.log(`  Source: ${newImageUrl}`);

    console.log(`  Sending to Real-ESRGAN (${UPSCALE_FACTOR}x)...`);
    const upscaledUrl = await callReplicate(newImageUrl);
    console.log(`  Upscale complete`);

    console.log(`  Downloading upscaled image...`);
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

    const originalPath = extractStoragePath(newImageUrl);
    if (!originalPath) {
      throw new Error(`Could not extract storage path from: ${newImageUrl}`);
    }

    const printPath = originalPath.replace("generated/", "print/");
    console.log(`  Uploading to: recipes/${printPath}`);

    const { error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(printPath, imageData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const printUrlOut = `${SUPABASE_URL}/storage/v1/object/public/recipes/${printPath}`;

    const dimensions = {
      width: newWidth,
      height: newHeight,
      original_width: origWidth,
      original_height: origHeight,
      upscaled: true,
      upscale_factor: UPSCALE_FACTOR,
    };

    await supabase
      .from("guest_recipes")
      .update({
        generated_image_url_print: printUrlOut,
        image_upscale_status: "ready",
        image_dimensions: dimensions,
      })
      .eq("id", recipeId);

    console.log(`Done: "${recipeName}" -> ${newWidth}x${newHeight}`);
    console.log(`  Print URL: ${printUrlOut}`);

    return jsonResponse({ success: true, recipe_id: recipeId, recipe_name: recipeName,
 print_url: printUrlOut, dimensions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error: ${msg}`);

    if (recipeId) {
      try {
        await supabase
          .from("guest_recipes")
          .update({ image_upscale_status: "error", image_dimensions: { error: msg } })
          .eq("id", recipeId);
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

function extractStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/recipes/";
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.substring(idx + marker.length) : null;
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

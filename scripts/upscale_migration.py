"""
Small Plates & Co. - Image Upscaling Migration Script
Migrates existing images to print-ready resolution using Real-ESRGAN

ACTUALIZADO: Usa 4x upscale para calidad óptima de impresión
"""

import os
import requests
import replicate
from supabase import create_client, Client
from PIL import Image
from io import BytesIO
import time
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
from pathlib import Path

# Load .env.local from project root
env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)

# ===========================================
# CONFIGURACIÓN
# Cambiar a None para procesar TODAS
# ===========================================
TEST_LIMIT = None  # Procesar TODAS las recetas
# ===========================================

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

# Print requirements (8.5x10 inches at 300ppi)
MIN_WIDTH = 2550
MIN_HEIGHT = 3000

# Upscale factor
UPSCALE_FACTOR = 4  # 4x para calidad óptima

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN


def get_pending_recipes(limit=None):
    """Fetch all recipes that need upscaling"""
    query = supabase.table("guest_recipes").select(
        "id, recipe_name, generated_image_url, group_id"
    ).eq(
        "image_upscale_status", "pending"
    ).not_.is_(
        "generated_image_url", "null"
    )
    
    if limit:
        query = query.limit(limit)
    
    response = query.execute()
    return response.data


def get_image_dimensions(image_url: str) -> tuple[int, int]:
    """Download image and get its dimensions"""
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content))
    return img.size  # (width, height)


def needs_upscale(width: int, height: int) -> bool:
    """Check if image needs upscaling based on print requirements"""
    # Check both orientations (landscape and portrait)
    meets_landscape = width >= MIN_HEIGHT and height >= MIN_WIDTH
    meets_portrait = width >= MIN_WIDTH and height >= MIN_HEIGHT
    return not (meets_landscape or meets_portrait)


def upscale_image(image_url: str) -> str:
    """Use Real-ESRGAN via Replicate to upscale image"""
    output = replicate.run(
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input={
            "image": image_url,
            "scale": UPSCALE_FACTOR,  # 4x upscale
            "face_enhance": False
        }
    )
    return output  # Returns URL of upscaled image


def extract_path_from_url(url: str) -> str:
    """Extract storage path from Supabase URL"""
    # URL format: https://xxx.supabase.co/storage/v1/object/public/recipes/generated/group_id/file.png
    parts = url.split("/storage/v1/object/public/recipes/")
    if len(parts) > 1:
        return parts[1]  # generated/group_id/file.png
    return None


def upload_to_print_folder(image_url: str, original_path: str) -> str:
    """Download upscaled image and upload to /print/ folder"""
    # Download the upscaled image from Replicate
    response = requests.get(image_url)
    image_data = response.content
    
    # Create new path in /print/ folder
    # Original: generated/group_id/file.png → print/group_id/file.png
    new_path = original_path.replace("generated/", "print/", 1)
    
    # Upload to Supabase Storage
    result = supabase.storage.from_("recipes").upload(
        new_path,
        image_data,
        {"content-type": "image/png", "upsert": "true"}
    )
    
    # Construct public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/recipes/{new_path}"
    return public_url


def update_recipe_status(recipe_id: str, print_url: str, dimensions: dict, upscaled: bool):
    """Update recipe with new print URL and status"""
    supabase.table("guest_recipes").update({
        "generated_image_url_print": print_url,
        "image_upscale_status": "ready",
        "image_dimensions": dimensions
    }).eq("id", recipe_id).execute()


def mark_error(recipe_id: str, error_message: str):
    """Mark recipe as having an error"""
    supabase.table("guest_recipes").update({
        "image_upscale_status": "error",
        "image_dimensions": {"error": error_message}
    }).eq("id", recipe_id).execute()


def process_recipe(recipe: dict) -> dict:
    """Process a single recipe's image"""
    recipe_id = recipe["id"]
    recipe_name = recipe["recipe_name"]
    image_url = recipe["generated_image_url"]
    
    print(f"\n{'='*60}")
    print(f"Processing: {recipe_name}")
    print(f"ID: {recipe_id}")
    
    try:
        # Step 1: Get current dimensions
        print("  → Getting image dimensions...")
        width, height = get_image_dimensions(image_url)
        print(f"  → Current size: {width}x{height}")
        
        # Step 2: Check if upscale needed
        if needs_upscale(width, height):
            print(f"  → Needs upscaling (min: {MIN_WIDTH}x{MIN_HEIGHT})")
            
            # Step 3: Upscale via Replicate
            print(f"  → Sending to Real-ESRGAN ({UPSCALE_FACTOR}x)...")
            start_time = time.time()
            upscaled_url = upscale_image(image_url)
            elapsed = time.time() - start_time
            print(f"  → Upscaled in {elapsed:.1f}s")
            
            # Step 4: Get new dimensions
            new_width, new_height = get_image_dimensions(upscaled_url)
            print(f"  → New size: {new_width}x{new_height}")
            
            # Calculate effective PPI for 8.5x10 print
            ppi_width = new_width / 8.5
            ppi_height = new_height / 10
            print(f"  → Effective PPI: {min(ppi_width, ppi_height):.0f}")
            
            # Step 5: Upload to /print/ folder
            print("  → Uploading to /print/ folder...")
            original_path = extract_path_from_url(image_url)
            print_url = upload_to_print_folder(upscaled_url, original_path)
            
            dimensions = {
                "width": new_width,
                "height": new_height,
                "original_width": width,
                "original_height": height,
                "upscaled": True,
                "upscale_factor": UPSCALE_FACTOR
            }
            
        else:
            print(f"  → Already meets requirements, copying to /print/")
            
            # Just copy to /print/ folder without upscaling
            original_path = extract_path_from_url(image_url)
            
            # Download and re-upload to /print/
            response = requests.get(image_url)
            new_path = original_path.replace("generated/", "print/", 1)
            
            supabase.storage.from_("recipes").upload(
                new_path,
                response.content,
                {"content-type": "image/png", "upsert": "true"}
            )
            
            print_url = f"{SUPABASE_URL}/storage/v1/object/public/recipes/{new_path}"
            
            dimensions = {
                "width": width,
                "height": height,
                "original_width": width,
                "original_height": height,
                "upscaled": False,
                "upscale_factor": 1
            }
        
        # Step 6: Update database
        print("  → Updating database...")
        update_recipe_status(recipe_id, print_url, dimensions, dimensions["upscaled"])
        
        print(f"  ✓ Done!")
        return {"success": True, "recipe_id": recipe_id, "upscaled": dimensions["upscaled"]}
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        mark_error(recipe_id, str(e))
        return {"success": False, "recipe_id": recipe_id, "error": str(e)}


def main():
    print("="*60)
    print("Small Plates & Co. - Image Upscaling Migration")
    print(f"Upscale factor: {UPSCALE_FACTOR}x")
    if TEST_LIMIT:
        print(f"⚠️  MODO PRUEBA: Solo {TEST_LIMIT} recetas")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Get pending recipes
    print("\nFetching recipes that need processing...")
    recipes = get_pending_recipes(limit=TEST_LIMIT)
    total = len(recipes)
    print(f"Found {total} recipes to process")
    
    if total == 0:
        print("Nothing to do!")
        return
    
    # Process each recipe
    results = {"success": 0, "failed": 0, "upscaled": 0, "copied": 0}
    
    for i, recipe in enumerate(recipes, 1):
        print(f"\n[{i}/{total}]", end="")
        result = process_recipe(recipe)
        
        if result["success"]:
            results["success"] += 1
            if result.get("upscaled"):
                results["upscaled"] += 1
            else:
                results["copied"] += 1
        else:
            results["failed"] += 1
    
    # Summary
    print("\n" + "="*60)
    print("MIGRATION COMPLETE")
    print("="*60)
    print(f"Total processed: {total}")
    print(f"  ✓ Successful: {results['success']}")
    print(f"    - Upscaled ({UPSCALE_FACTOR}x): {results['upscaled']}")
    print(f"    - Copied (already good): {results['copied']}")
    print(f"  ✗ Failed: {results['failed']}")
    print(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
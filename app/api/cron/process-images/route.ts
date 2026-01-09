import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processRecipeImage, hasValidExtractedData } from '@/lib/supabase/imageProcessing';

/**
 * Cron job endpoint para procesar imágenes de recetas en la cola
 * Se ejecuta cada 5 minutos desde Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (Vercel Cron añade este header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('🚀 Starting image processing cron job');
    const supabase = createSupabaseAdminClient();

    // Obtener items pendientes (máximo 5 para no sobrecargar)
    const { data: pendingItems, error: fetchError } = await supabase
      .from('image_processing_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3) // Solo items con menos de 3 intentos
      .order('created_at', { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching pending items:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch pending items',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ No pending items to process');
      return NextResponse.json({ 
        message: 'No pending items',
        processed: 0 
      });
    }

    console.log(`📋 Found ${pendingItems.length} items to process`);
    let processedCount = 0;
    let failedCount = 0;

    // Procesar cada item
    for (const item of pendingItems) {
      try {
        console.log(`🔄 Processing recipe ${item.recipe_id}...`);

        // Marcar como "processing" para evitar procesamiento duplicado
        await supabase
          .from('image_processing_queue')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Procesar la imagen
        const { data: processedData, error: processError } = await processRecipeImage(
          item.image_url,
          item.recipe_id,
          item.recipe_name
        );

        if (processError) {
          throw new Error(`Image processing failed: ${processError}`);
        }

        // Si tenemos datos válidos, actualizar la receta
        if (hasValidExtractedData(processedData)) {
          console.log('✅ Valid data extracted, updating recipe...');
          
          const extractedUpdate: any = {
            updated_at: new Date().toISOString(),
          };

          // Never update recipe_name - always preserve user's title
          if (processedData!.ingredients) extractedUpdate.ingredients = processedData!.ingredients;
          if (processedData!.instructions) extractedUpdate.instructions = processedData!.instructions;
          if (processedData!.raw_text) extractedUpdate.raw_recipe_text = processedData!.raw_text;
          if (processedData!.confidence_score !== undefined) extractedUpdate.confidence_score = processedData!.confidence_score;

          const { error: updateError } = await supabase
            .from('guest_recipes')
            .update(extractedUpdate)
            .eq('id', item.recipe_id);

          if (updateError) {
            throw new Error(`Recipe update failed: ${updateError.message}`);
          }
        }

        // Marcar como completado
        await supabase
          .from('image_processing_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        processedCount++;
        console.log(`✅ Successfully processed recipe ${item.recipe_id}`);

      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing item ${item.id}:`, errorMessage);

        // Actualizar el item con el error y incrementar intentos
        await supabase
          .from('image_processing_queue')
          .update({
            status: item.attempts >= 2 ? 'failed' : 'pending',
            attempts: item.attempts + 1,
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
            processed_at: item.attempts >= 2 ? new Date().toISOString() : null
          })
          .eq('id', item.id);
      }
    }

    console.log(`✅ Cron job completed: ${processedCount} processed, ${failedCount} failed`);

    return NextResponse.json({
      message: 'Cron job completed',
      processed: processedCount,
      failed: failedCount,
      total: pendingItems.length
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Reason: 8x10 inch book (portrait). Spread = 16x10 inches.
// At 150 DPI: 2400x1500 px. Scale factor = 150/72 ≈ 2.08 for pt→px.
const SPREAD_WIDTH = 2400;
const SPREAD_HEIGHT = 1500;

// Reason: InDesign margins — Top 0.5", Bottom 0.5", Inside 0.75" (gutter), Outside 0.5"
// At 150 DPI: top/bottom = 75px, outside = 75px, inside = 112px
const MARGIN_TOP = 75;
const MARGIN_BOTTOM = 75;
const MARGIN_OUTSIDE = 75;
const MARGIN_INSIDE = 112;

// Reason: Satori doesn't load system fonts. We fetch EB Garamond (closest to Minion Pro)
// from Google Fonts and pass it as a custom font. Cached in module scope for performance.
let garamondRegular: ArrayBuffer | null = null;
let garamondItalic: ArrayBuffer | null = null;
let interRegular: ArrayBuffer | null = null;
let interSemibold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!garamondRegular) {
    const [gReg, gIta, iReg, iSemi] = await Promise.all([
      fetch('https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/ebgaramond/v32/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QI96.ttf').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf').then(r => r.arrayBuffer()),
    ]);
    garamondRegular = gReg;
    garamondItalic = gIta;
    interRegular = iReg;
    interSemibold = iSemi;
  }
  return { garamondRegular, garamondItalic, interRegular, interSemibold };
}

export async function GET(request: NextRequest) {
  const fonts = await loadFonts();
  const url = new URL(request.url);
  const recipeId = url.searchParams.get('recipe_id');
  const pageNum = url.searchParams.get('page') || '28';

  let guestName = 'Valeria Chavez';
  let recipeName = 'Arroz Chaufa de Pollo Arroz Chaufa de Pollo Arroz Chaufa de Pollo Arroz Chaufa de Pollo Arroz Chaufa de ';
  let note = 'Un plato buenazo y súper práctico, que espero los acompañe en esta nueva etapa.';
  let ingredients = `2 tazas de arroz cocido
200 gr de pollo
1 a 2 cucharadas de salsa de soya
1 cucharada de jengibre finamente picado
Cebollino / Cebolla china picado
3 huevos
1 cucharadita de fécula de maíz
Aceite vegetal cantidad necesaria
Sal al gusto
Unas gotas de aceite de ajonjolí para terminar (Opcional)`;
  let instructions = `Marinar el pollo: Colocar el pollo en un bowl y sazonar ligeramente con sal. Añadir la fécula de maíz y un pequeño chorro de agua, mezclar bien hasta cubrir uniformemente. Dejar marinar entre 15 y 20 minutos. Agregar 2 cucharadas de aceite vegetal al pollo marinado y mezclar; esto ayudará a que no se pegue durante el salteado.

Saltear el pollo: Calentar una sartén amplia o wok a fuego medio-alto con un poco de aceite vegetal. Saltear el pollo hasta que esté cocido y ligeramente dorado. Retirar y reservar.

Preparar el huevo: En la misma sartén, añadir un poco más de aceite si es necesario. Dorar ligeramente el jengibre picado hasta que libere su aroma (sin quemarlo). Agregar los huevos previamente batidos y remover suavemente hasta que cuajen en trozos medianos.

Incorporar el arroz: Añadir el arroz frío a la sartén y saltear a fuego alto, separando bien los granos. Sazonar con una pizca de sal y la salsa de soya al gusto. Mezclar constantemente para que la salsa se impregne de manera uniforme.

Finalizar el chaufa: Incorporar el pollo reservado y el cebollino o cebolla china. Saltear durante 30 segundos a 1 minuto, solo lo suficiente para integrar sabores y aromatizar. Opcionalmente, añadir unas gotas de aceite de ajonjolí al final.`;
  let imageUrl: string | null = null;

  if (recipeId) {
    try {
      const supabase = createSupabaseAdminClient();

      const { data: recipe } = await supabase
        .from('guest_recipes')
        .select(`
          id,
          recipe_name,
          ingredients,
          instructions,
          comments,
          generated_image_url_print,
          generated_image_url,
          guest_id,
          guests!inner(first_name, last_name)
        `)
        .eq('id', recipeId)
        .single();

      if (recipe) {
        const guest = recipe.guests as unknown as { first_name: string; last_name: string };
        guestName = `${guest.first_name} ${guest.last_name}`;
        recipeName = recipe.recipe_name;
        note = recipe.comments || '';
        ingredients = recipe.ingredients || '';
        instructions = recipe.instructions || '';
        imageUrl = recipe.generated_image_url_print || recipe.generated_image_url;

        const { data: printReady } = await supabase
          .from('recipe_print_ready')
          .select('recipe_name_clean, ingredients_clean, instructions_clean, note_clean')
          .eq('recipe_id', recipeId)
          .single();

        if (printReady) {
          recipeName = printReady.recipe_name_clean || recipeName;
          ingredients = printReady.ingredients_clean || ingredients;
          instructions = printReady.instructions_clean || instructions;
          note = printReady.note_clean || note;
        }
      }
    } catch {
      // Fall through to placeholder data
    }
  }

  const maxInstructionChars = 1500;
  const instructionsTruncated = instructions.length > maxInstructionChars;
  const displayInstructions = instructionsTruncated
    ? instructions.slice(0, maxInstructionChars).replace(/\s+\S*$/, '') + '... (will continue on next page)'
    : instructions;

  const maxIngredientChars = 500;
  const displayIngredients = ingredients.length > maxIngredientChars
    ? ingredients.slice(0, maxIngredientChars).replace(/\s+\S*$/, '') + '...'
    : ingredients;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* ===== LEFT PAGE — Recipe text ===== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            height: '100%',
            backgroundColor: '#FDFCFA',
            paddingTop: MARGIN_TOP,
            paddingBottom: MARGIN_BOTTOM,
            paddingLeft: MARGIN_OUTSIDE,
            paddingRight: MARGIN_INSIDE,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Guest name — ~12pt = 25px at 150dpi */}
            <p
              style={{
                fontSize: 25,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#8A8580',
                marginBottom: 6,
                fontFamily: 'EB Garamond',
              }}
            >
              {guestName}
            </p>

            {/* Recipe name — ~28pt = 58px at 150dpi */}
            <p
              style={{
                fontSize: 58,
                fontFamily: 'EB Garamond',
                color: '#2D2D2D',
                marginBottom: 20,
                lineHeight: 1.15,
              }}
            >
              {recipeName}
            </p>

            {/* Note — ~11pt italic = 23px at 150dpi */}
            {note && (
              <p
                style={{
                  fontSize: 23,
                  fontStyle: 'italic',
                  color: '#8A8580',
                  marginBottom: 32,
                  lineHeight: 1.45,
                  fontFamily: 'EB Garamond',
                }}
              >
                {note}
              </p>
            )}

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 1,
                backgroundColor: '#C8C3BC',
                marginBottom: 36,
              }}
            />

            {/* Two columns: Ingredients + Instructions */}
            <div style={{ display: 'flex', flex: 1, gap: 40, overflow: 'hidden' }}>
              {/* Ingredients — ~8pt header, ~10.5pt body */}
              <div style={{ display: 'flex', flexDirection: 'column', width: 280 }}>
                <p
                  style={{
                    fontSize: 17,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#6B6660',
                    fontWeight: 600,
                    marginBottom: 20,
                    fontFamily: 'Inter',
                  }}
                >
                  Ingredients
                </p>
                <p
                  style={{
                    fontSize: 22,
                    color: '#3D3D3D',
                    lineHeight: 1.75,
                    fontFamily: 'EB Garamond',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {displayIngredients}
                </p>
              </div>

              {/* Instructions — ~8pt header, ~10.5pt body */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p
                  style={{
                    fontSize: 17,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#6B6660',
                    fontWeight: 600,
                    marginBottom: 20,
                    fontFamily: 'Inter',
                  }}
                >
                  Instructions
                </p>
                <p
                  style={{
                    fontSize: 22,
                    color: '#3D3D3D',
                    lineHeight: 1.65,
                    fontFamily: 'EB Garamond',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {displayInstructions}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ===== RIGHT PAGE — Food image ===== */}
        <div
          style={{
            display: 'flex',
            width: '50%',
            height: '100%',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recipeName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <p style={{ fontSize: 28, color: '#9ca3af', fontFamily: 'EB Garamond' }}>
              [Food Image]
            </p>
          )}
        </div>

        {/* ===== SHARED FOOTER — page number left, caption right, same line ===== */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '50%',
              alignItems: 'center',
              paddingLeft: MARGIN_OUTSIDE,
            }}
          >
            <p
              style={{
                fontSize: 19,
                color: '#2D2D2D',
                fontFamily: 'EB Garamond',
                fontWeight: 600,
              }}
            >
              {pageNum}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              width: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: '1px solid #e0dbd4',
              backgroundColor: 'rgba(248,247,245,0.9)',
            }}
          >
            <p
              style={{
                fontSize: 17,
                color: '#4A4540',
                fontFamily: 'EB Garamond',
              }}
            >
              {recipeName}
            </p>
          </div>
        </div>
      </div>
    ),
    {
      width: SPREAD_WIDTH,
      height: SPREAD_HEIGHT,
      fonts: [
        {
          name: 'EB Garamond',
          data: fonts.garamondRegular!,
          style: 'normal' as const,
          weight: 400 as const,
        },
        {
          name: 'EB Garamond',
          data: fonts.garamondItalic!,
          style: 'italic' as const,
          weight: 400 as const,
        },
        {
          name: 'Inter',
          data: fonts.interRegular!,
          style: 'normal' as const,
          weight: 400 as const,
        },
        {
          name: 'Inter',
          data: fonts.interSemibold!,
          style: 'normal' as const,
          weight: 600 as const,
        },
      ],
    },
  );
}

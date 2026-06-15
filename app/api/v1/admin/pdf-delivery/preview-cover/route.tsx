import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { splitCoupleName, DEFAULT_COVER_LINE } from '@/lib/cover/layout';

export const runtime = 'nodejs';

const W = 900;
const H = 1125;

// Module-scope font + image cache (warm across requests in the same instance)
let fontRegular: ArrayBuffer | undefined;
let fontDisplay: ArrayBuffer | undefined;
let paellaData: string | undefined;
let logoData: string | undefined;
let ampData: string | undefined;

// Reason: fetch assets from the deployment's own static origin instead of
// reading them off disk. fs.readFileSync(process.cwd()/public/...) made Next's
// output file tracing bundle all of public/ (~250 MB) into this serverless
// function, exceeding Vercel's 250 MB limit. Fetching over HTTP (same pattern
// as the showcase/preview route) keeps the function bundle tiny.
async function readFont(origin: string, filename: string): Promise<ArrayBuffer> {
  const res = await fetch(new URL(`/fonts/${filename}`, origin));
  return res.arrayBuffer();
}

async function readImage(origin: string, relPath: string): Promise<string> {
  const res = await fetch(new URL(`/${relPath}`, origin));
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = relPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}


export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get('group_id');
  const directName = url.searchParams.get('name');

  let coupleNamePlain = directName || 'Cheese & Wine';
  let coverLine = url.searchParams.get('cover_line') || DEFAULT_COVER_LINE;

  if (groupId && !directName) {
    const supabase = createSupabaseAdminClient();
    const { data: group } = await supabase
      .from('groups')
      .select('print_couple_name, print_details_confirmed_at, couple_display_name, name, print_cover_line')
      .eq('id', groupId)
      .single();
    if (group) {
      // Reason: once the owner confirms the final printed name in Review, that's
      // the source of truth. Before confirmation, fall back to the editable
      // cookbook name (couple_display_name is kept in sync with it; name is the
      // last resort for legacy rows).
      const confirmed = group.print_details_confirmed_at && group.print_couple_name;
      coupleNamePlain = confirmed || group.couple_display_name || group.name || 'The couple';
      coverLine = group.print_cover_line || DEFAULT_COVER_LINE;
    }
  }

  // Load resources once per instance (fetched from this deployment's origin)
  const origin = url.origin;
  if (!fontRegular) fontRegular = await readFont(origin, 'MinionPro-Regular.otf');
  if (!fontDisplay) fontDisplay = await readFont(origin, 'MinionPro-Display.otf');
  if (!paellaData) paellaData = await readImage(origin, 'images/email-pdf/paella_transparent_sm.png');
  if (!logoData) logoData = await readImage(origin, 'images/SmallPlates_logo_horizontal.png');
  if (!ampData) ampData = await readImage(origin, 'images/email-pdf/ampestrand_gold_transparent.png');

  const { hasAmp, part1, part2, fontSize } = splitCoupleName(coupleNamePlain);
  const ampImgSize = Math.round(fontSize * 1.05);

  // Reason: render the name as a flat list of WORD tokens (with the gold ampersand
  // as one token in the middle) so flex-wrap breaks between words, not at the rigid
  // part1/&/part2 boundaries. Long couple names then wrap naturally ("Ana & Richi
  // Book" / "TTtotal") instead of dumping the whole second name onto a new line.
  const nameWords1 = part1.split(/\s+/).filter(Boolean);
  const nameWords2 = hasAmp ? part2.split(/\s+/).filter(Boolean) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f0ece3',
        }}
      >
        {/* Paella — independently positioned so we can move it freely */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={paellaData}
          alt=""
          width={1170}
          height={1170}
          style={{
            position: 'absolute',
            top: 110,
            left: (W - 1170) / 2,
          }}
        />

        {/* Reason: flat front cover, no spine/page-edge gradients — straight
            edges (Storyworth-style). External depth is handled by the shadow on
            the BookPreviewPanel wrapper, not baked into the image. */}

        {/* Text layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Eyebrow — independently positioned */}
          <div
            style={{
              position: 'absolute',
              top: 160,
              left: 0,
              width: W,
              fontFamily: 'MinionPro-Display',
              fontSize: 22,
              letterSpacing: '0.24em',
              color: '#8a8c8e',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {coverLine.toUpperCase()}
          </div>

          {/* Couple name — independently positioned. Reason: long names WRAP to a
              second line at a large font (matching the printed InDesign cover)
              instead of shrinking to fit one line. Side padding gives real left/
              right margins so text never reaches the edge. */}
          <div
            style={{
              position: 'absolute',
              top: 245,
              left: 0,
              width: W,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 80,
              paddingRight: 80,
              rowGap: 8,
              columnGap: 18,
            }}
          >
            {nameWords1.map((w, i) => (
              <span
                key={`a${i}`}
                style={{ fontFamily: 'MinionPro-Display', fontSize, color: '#4b4b4a', lineHeight: 1.08 }}
              >
                {w}
              </span>
            ))}

            {hasAmp && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ampData} alt="&" width={ampImgSize} height={ampImgSize} style={{ marginLeft: 4, marginRight: 4 }} />
              </>
            )}

            {nameWords2.map((w, i) => (
              <span
                key={`b${i}`}
                style={{ fontFamily: 'MinionPro-Display', fontSize, color: '#4b4b4a', lineHeight: 1.08 }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Logo footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoData}
              alt="Small Plates & Co."
              width={168}
              height={95}
              style={{ opacity: 0.6 }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'MinionPro-Regular', data: fontRegular!, style: 'normal', weight: 400 },
        { name: 'MinionPro-Display', data: fontDisplay!, style: 'normal', weight: 400 },
      ],
    }
  );
}

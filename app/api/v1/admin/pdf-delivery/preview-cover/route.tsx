import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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

// Scale title font size down for long names so it fits on one line.
// Reason: the cover is 900px wide with 48px padding each side (~804px usable),
// so there's room to keep the font larger for medium-long names. Finer buckets +
// a higher floor stop names like "Mom Lilyth Fieston Loco!" from shrinking to a
// cramped 46px.
function titleFontSize(maxPartLen: number): number {
  if (maxPartLen <= 7) return 80;
  if (maxPartLen <= 10) return 72;
  if (maxPartLen <= 14) return 70;
  if (maxPartLen <= 18) return 68;
  if (maxPartLen <= 22) return 66;
  if (maxPartLen <= 27) return 64;
  if (maxPartLen <= 33) return 56;
  return 48;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get('group_id');
  const directName = url.searchParams.get('name');

  let coupleNamePlain = directName || 'Cheese & Wine';

  if (groupId && !directName) {
    const supabase = createSupabaseAdminClient();
    const { data: group } = await supabase
      .from('groups')
      .select('print_couple_name, print_details_confirmed_at, couple_display_name, name')
      .eq('id', groupId)
      .single();
    if (group) {
      // Reason: once the owner confirms the final printed name in Review, that's
      // the source of truth. Before confirmation, fall back to the editable
      // cookbook name (couple_display_name is kept in sync with it; name is the
      // last resort for legacy rows).
      const confirmed = group.print_details_confirmed_at && group.print_couple_name;
      coupleNamePlain = confirmed || group.couple_display_name || group.name || 'The couple';
    }
  }

  // Load resources once per instance (fetched from this deployment's origin)
  const origin = url.origin;
  if (!fontRegular) fontRegular = await readFont(origin, 'MinionPro-Regular.otf');
  if (!fontDisplay) fontDisplay = await readFont(origin, 'MinionPro-Display.otf');
  if (!paellaData) paellaData = await readImage(origin, 'images/email-pdf/paella_transparent_sm.png');
  if (!logoData) logoData = await readImage(origin, 'images/SmallPlates_logo_horizontal.png');
  if (!ampData) ampData = await readImage(origin, 'images/email-pdf/ampestrand_gold_transparent.png');

  const ampIdx = coupleNamePlain.indexOf('&');
  const hasAmp = ampIdx > -1;
  const part1 = hasAmp ? coupleNamePlain.slice(0, ampIdx).trim() : coupleNamePlain;
  const part2 = hasAmp ? coupleNamePlain.slice(ampIdx + 1).trim() : '';

  const fontSize = titleFontSize(Math.max(part1.length, part2.length));
  const ampImgSize = Math.round(fontSize * 1.05);

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
            {'RECIPES FROM THE PEOPLE WHO LOVE'}
          </div>

          {/* Couple name — independently positioned */}
          <div
            style={{
              position: 'absolute',
              top: 245,
              left: 0,
              width: W,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              // Reason: tighter side padding gives long names (e.g. "Mom Lilyth
              // Fieston Loco!") more room so the font stays larger instead of
              // shrinking to fit a narrow center column. Short names are centered
              // and unaffected.
              paddingLeft: 6,
              paddingRight: 6,
            }}
          >
            <span
              style={{
                fontFamily: 'MinionPro-Display',
                fontSize,
                color: '#4b4b4a',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              {part1}
            </span>

            {hasAmp && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ampData}
                  alt="&"
                  width={ampImgSize}
                  height={ampImgSize}
                  style={{ marginLeft: 6, marginRight: 6 }}
                />
                <span
                  style={{
                    fontFamily: 'MinionPro-Display',
                    fontSize,
                    color: '#4b4b4a',
                    lineHeight: 1,
                    display: 'flex',
                  }}
                >
                  {part2}
                </span>
              </>
            )}
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

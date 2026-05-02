import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const W = 900;
const H = 1125;

// Module-scope font + image cache (warm across requests in the same instance)
let fontRegular: ArrayBuffer | undefined;
let fontDisplay: ArrayBuffer | undefined;
let paellaData: string | undefined;
let logoData: string | undefined;
let ampData: string | undefined;

function readFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function readImage(relPath: string): string {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', relPath));
  const mime = relPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Scale title font size down for long names so it fits on one line
function titleFontSize(maxPartLen: number): number {
  if (maxPartLen <= 7) return 92;
  if (maxPartLen <= 10) return 82;
  if (maxPartLen <= 14) return 70;
  if (maxPartLen <= 18) return 60;
  return 50;
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
      .select('couple_display_name, name')
      .eq('id', groupId)
      .single();
    if (group) {
      coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    }
  }

  // Load resources once per instance
  if (!fontRegular) fontRegular = readFont('MinionPro-Regular.otf');
  if (!fontDisplay) fontDisplay = readFont('MinionPro-Display.otf');
  if (!paellaData) paellaData = readImage('images/email-pdf/paella_transparent_sm.png');
  if (!logoData) logoData = readImage('images/SmallPlates_logo_horizontal.png');
  if (!ampData) ampData = readImage('images/email-pdf/ampestrand_gold_transparent.png');

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
          backgroundColor: '#EDE8E1',
        }}
      >
        {/* Paella — independently positioned so we can move it freely */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={paellaData}
          alt=""
          width={1100}
          height={1100}
          style={{
            position: 'absolute',
            top: 120,
            left: (W - 1100) / 2,
          }}
        />

        {/* Spine — left edge gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 12,
            height: H,
            background: 'linear-gradient(to right, rgba(0,0,0,0.20), transparent)',
            display: 'flex',
          }}
        />

        {/* Page-edge depth — right edge gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 20,
            height: H,
            background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)',
            display: 'flex',
          }}
        />

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
              top: 135,
              left: 0,
              width: W,
              fontFamily: 'MinionPro-Display',
              fontSize: 22,
              letterSpacing: '0.24em',
              color: '#b1b3b5',
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
              top: 220,
              left: 0,
              width: W,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 48,
              paddingRight: 48,
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

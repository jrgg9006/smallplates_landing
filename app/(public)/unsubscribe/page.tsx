import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Unsubscribed — Small Plates & Co.',
  robots: 'noindex, nofollow',
};

type Status = 'ok' | 'invalid' | 'error';

async function processUnsubscribe(gid: string): Promise<Status> {
  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from('guests')
    .update({ showcase_opted_out: true }, { count: 'exact' })
    .eq('id', gid);

  if (error) return 'error';
  if ((count ?? 0) === 0) return 'invalid';
  return 'ok';
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const gid = typeof params.gid === 'string' ? params.gid : null;

  const status: Status = gid ? await processUnsubscribe(gid) : 'invalid';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        <div style={{ marginBottom: 40 }}>
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates &amp; Co."
            width={140}
            height={40}
            style={{ display: 'inline-block', height: 'auto' }}
          />
        </div>

        {status === 'ok' ? (
          <>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 400,
              color: '#2D2D2D',
              margin: '0 0 16px',
            }}>
              You&rsquo;re off the list.
            </h1>
            <p style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif',
              fontSize: 15,
              color: '#666666',
              lineHeight: 1.65,
              margin: 0,
            }}>
              We won&rsquo;t send you any more showcase emails.
            </p>
          </>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 400,
              color: '#2D2D2D',
              margin: '0 0 16px',
            }}>
              That link didn&rsquo;t work.
            </h1>
            <p style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, Arial, sans-serif',
              fontSize: 15,
              color: '#666666',
              lineHeight: 1.65,
              margin: 0,
            }}>
              Email us at{' '}
              <a
                href="mailto:team@smallplatesandcompany.com"
                style={{ color: '#2D2D2D', textDecoration: 'underline' }}
              >
                team@smallplatesandcompany.com
              </a>
              {' '}and we&rsquo;ll take care of it.
            </p>
          </>
        )}

        <div style={{
          marginTop: 48,
          borderTop: '1px solid #E8E0D5',
          paddingTop: 24,
        }}>
          <Link
            href="/"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: '#9A9590',
              fontStyle: 'italic',
              textDecoration: 'none',
            }}
          >
            ← Back to Small Plates
          </Link>
        </div>

      </div>
    </div>
  );
}

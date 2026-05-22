'use client';

import { useEffect, useRef, useState } from 'react';
import type { QAStatus } from '@/lib/qa-review/types';

interface Props {
  reviewId: string;
  onComplete: (status: QAStatus) => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes safety cap

interface ReviewSnapshot {
  status: QAStatus;
  pdf_page_count: number | null;
  duration_ms: number | null;
  error_message: string | null;
}

export default function ReviewProgress({ reviewId, onComplete }: Props) {
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const completedFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/v1/admin/qa-review/${reviewId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ReviewSnapshot;
        if (cancelled) return;
        setSnapshot(data);

        if (data.status === 'complete' || data.status === 'failed') {
          if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            onComplete(data.status);
          }
          return;
        }

        if (Date.now() - startedAtRef.current > MAX_DURATION_MS) {
          // We never give up automatically — just show a message and keep polling.
          // (Railway might still finish.)
        }

        timeout = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) timeout = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [reviewId, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isProcessing = !snapshot || snapshot.status === 'uploading' || snapshot.status === 'processing';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-4">
        {isProcessing ? (
          <div className="animate-spin h-8 w-8 border-2 border-brand-honey border-t-transparent rounded-full" />
        ) : snapshot?.status === 'complete' ? (
          <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl">
            ✓
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xl">
            !
          </div>
        )}
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {isProcessing
              ? 'Revisando…'
              : snapshot?.status === 'complete'
              ? 'Revisión completa'
              : 'La revisión falló'}
          </div>
          <div className="text-sm text-gray-500">
            {isProcessing
              ? `Tiempo transcurrido: ${elapsedSec}s · típicamente 30–90s`
              : snapshot?.duration_ms != null
              ? `Duró ${(snapshot.duration_ms / 1000).toFixed(1)}s`
              : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

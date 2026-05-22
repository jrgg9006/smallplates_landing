'use client';

import { useRef, useState } from 'react';
import { QA_MAX_PDF_SIZE_BYTES } from '@/lib/qa-review/types';
import type { BookOption } from './BookSelector';

interface Props {
  book: BookOption;
  onUploaded: (reviewId: string) => void;
  onCancel: () => void;
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'creating' }
  | { kind: 'uploading'; progress: number }
  | { kind: 'starting' }
  | { kind: 'error'; message: string };

export default function PdfUploader({ book, onUploaded, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ kind: 'idle' });
  const [dragOver, setDragOver] = useState(false);

  function validateFile(candidate: File | null): string | null {
    if (!candidate) return 'No seleccionaste un archivo.';
    if (candidate.type !== 'application/pdf') return 'Solo se aceptan PDFs.';
    if (candidate.size > QA_MAX_PDF_SIZE_BYTES) {
      const mb = (QA_MAX_PDF_SIZE_BYTES / 1024 / 1024).toFixed(0);
      return `El PDF pesa ${(candidate.size / 1024 / 1024).toFixed(1)} MB. Máximo permitido: ${mb} MB. Exporta una versión más ligera desde InDesign.`;
    }
    return null;
  }

  function handleFileChosen(candidate: File | null) {
    const err = validateFile(candidate);
    if (err) {
      setState({ kind: 'error', message: err });
      setFile(null);
      return;
    }
    setFile(candidate);
    setState({ kind: 'idle' });
  }

  async function uploadWithProgress(signedUrl: string, body: File) {
    // Reason: fetch() does not expose upload progress. Use XHR so the user
    // sees a percentage during a 30-50 MB upload.
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setState({ kind: 'uploading', progress });
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Storage rechazó el upload (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Error de red al subir el PDF.'));
      xhr.send(body);
    });
  }

  async function startUpload() {
    if (!file) return;
    setState({ kind: 'creating' });
    try {
      // 1. Ask the server for a signed upload URL (also creates the review row)
      const uploadRes = await fetch('/api/v1/admin/qa-review/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: book.id, pdf_size_bytes: file.size }),
      });
      const uploadData = (await uploadRes.json()) as {
        review_id?: string;
        signed_url?: string;
        error?: string;
      };
      if (!uploadRes.ok || !uploadData.review_id || !uploadData.signed_url) {
        throw new Error(uploadData.error || 'No se pudo crear la revisión.');
      }
      const reviewId = uploadData.review_id;

      // 2. PUT the PDF directly to Supabase Storage
      setState({ kind: 'uploading', progress: 0 });
      await uploadWithProgress(uploadData.signed_url, file);

      // 3. Tell the server to dispatch Railway
      setState({ kind: 'starting' });
      const startRes = await fetch('/api/v1/admin/qa-review/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId }),
      });
      const startData = (await startRes.json()) as { error?: string };
      if (!startRes.ok) {
        throw new Error(startData.error || 'No se pudo iniciar la revisión.');
      }

      onUploaded(reviewId);
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  const isBusy = state.kind === 'creating' || state.kind === 'uploading' || state.kind === 'starting';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sube el PDF</h2>
          <p className="text-sm text-gray-500 mt-1">
            Libro: <span className="font-medium text-gray-900">{book.couple_display_name}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          disabled={isBusy}
          className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
        >
          Cambiar libro
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (isBusy) return;
          handleFileChosen(e.dataTransfer.files[0] ?? null);
        }}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragOver
            ? 'border-brand-honey bg-honey/5'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={isBusy}
          onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <div>
            <div className="text-gray-900 font-medium">{file.name}</div>
            <div className="text-sm text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
            {!isBusy && (
              <button
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="text-sm text-gray-500 hover:text-gray-900 mt-2"
              >
                Quitar
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="text-gray-500 mb-2">Arrastra el PDF aquí o</div>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Seleccionar archivo
            </button>
            <div className="text-xs text-gray-400 mt-3">
              PDF · máx {(QA_MAX_PDF_SIZE_BYTES / 1024 / 1024).toFixed(0)} MB
            </div>
          </>
        )}
      </div>

      {state.kind === 'uploading' && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subiendo a Storage…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-honey transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.kind === 'creating' && (
        <p className="mt-4 text-sm text-gray-600">Preparando revisión…</p>
      )}

      {state.kind === 'starting' && (
        <p className="mt-4 text-sm text-gray-600">Lanzando agente de QA…</p>
      )}

      {state.kind === 'error' && (
        <p className="mt-4 text-sm text-red-600 whitespace-pre-line">{state.message}</p>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={startUpload}
          disabled={!file || isBusy}
          className="px-6 py-2 bg-brand-honey text-white rounded-lg font-medium hover:bg-brand-honey/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? 'Procesando…' : 'Iniciar revisión'}
        </button>
      </div>
    </div>
  );
}

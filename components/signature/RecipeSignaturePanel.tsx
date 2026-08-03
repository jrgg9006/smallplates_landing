"use client";

import { useRef, useState } from "react";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

// Reason: spike técnico — dibujar/guardar/ver la firma del invitado atada a una
// receta real (guest_recipes.signature_url). Solo admin; no toca el flujo público.
// Modelo: una sola firma por receta. Reemplazarla sobrescribe la anterior (upsert).
export default function RecipeSignaturePanel({
  recipeId,
  signatureUrl,
}: {
  recipeId: string;
  signatureUrl: string | null;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(signatureUrl);
  const [capturing, setCapturing] = useState<boolean>(!signatureUrl);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const dataUrl = padRef.current?.toDataURL();
    if (!dataUrl) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/recipes/${recipeId}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la firma");
      // Cache-buster: la ruta en storage es fija (upsert), forzamos recarga.
      setDisplayUrl(`${data.signature_url}?t=${Date.now()}`);
      setCapturing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la firma");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Firma</h3>

      {/* Vista: firma ya guardada (una sola por receta) */}
      {displayUrl && !capturing && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Firma del invitado"
            className="max-h-40 rounded-lg border border-gray-200 bg-white p-2"
          />
          <button
            type="button"
            onClick={() => setCapturing(true)}
            className="mt-3 block text-sm font-medium text-gray-600 hover:text-gray-900 underline"
          >
            Reemplazar firma
          </button>
        </div>
      )}

      {/* Vista: capturar una firma nueva */}
      {capturing && (
        <div className="max-w-md">
          <SignaturePad ref={padRef} onChange={setIsEmpty} />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isEmpty || saving}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Guardar firma"}
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={() => {
                  setCapturing(false);
                  setError(null);
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

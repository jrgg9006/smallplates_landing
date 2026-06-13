'use client';

import { useEffect, useState } from 'react';
import { RecipeDiffView, type EditHistoryRow } from './RecipeDiffView';

interface RecipeGuest {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_self: boolean | null;
}

interface RecipeData {
  id: string;
  recipe_name: string;
  ingredients: string | null;
  instructions: string | null;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  raw_recipe_text: string | null;
  upload_method: string | null;
  source: string | null;
  deleted_at: string | null;
  created_at: string;
  guests: RecipeGuest | null;
}

function guestLabel(g: RecipeGuest | null): string {
  if (!g) return 'Alguien';
  if (g.is_self) return 'El organizador';
  return [g.first_name, g.last_name].filter(Boolean).join(' ') || g.email || 'Guest';
}

// Reason: when an image upload fails OCR, the text fields hold placeholders like
// "See uploaded images" / "1 image uploaded" — not real recipe content.
function isPlaceholder(text: string | null): boolean {
  return !text?.trim() || /uploaded image/i.test(text);
}

export function RecipeViewModal({
  recipeId,
  editId,
  onClose,
}: {
  recipeId: string;
  editId?: string;
  onClose: () => void;
}) {
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [history, setHistory] = useState<EditHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Reason: open in diff mode when launched from an edit item; let the user flip to the full recipe.
  const [mode, setMode] = useState<'recipe' | 'diff'>(editId ? 'diff' : 'recipe');

  useEffect(() => setMode(editId ? 'diff' : 'recipe'), [recipeId, editId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setRecipe(null);
    setHistory([]);
    setError(null);
    fetch(`/api/v1/admin/content/recipes/${recipeId}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Receta no encontrada' : `Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setRecipe(data.recipe as RecipeData);
        setHistory((data.history ?? []) as EditHistoryRow[]);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Error de conexión'));
    return () => {
      active = false;
    };
  }, [recipeId]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 rounded-md px-2 py-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="max-h-[85vh] overflow-y-auto px-8 py-8 lg:px-12">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!recipe && !error && <p className="text-sm text-gray-400">Cargando receta…</p>}

          {recipe && (() => {
            // Reason: the originals the guest uploaded. Photos live in document_urls;
            // fall back to image_url. This is what "ver/descargar lo que subieron" means.
            const uploadedImages =
              recipe.document_urls && recipe.document_urls.length > 0
                ? recipe.document_urls
                : recipe.image_url
                  ? [recipe.image_url]
                  : [];
            const hasText = !isPlaceholder(recipe.ingredients) || !isPlaceholder(recipe.instructions);
            const showRaw = !hasText && !!recipe.raw_recipe_text?.trim();

            return (
            <>
              <p className="mb-2 font-serif text-xs uppercase tracking-[0.2em] text-gray-400">
                {mode === 'diff'
                  ? 'Cambios'
                  : `${guestLabel(recipe.guests)}${
                      recipe.source === 'collection'
                        ? ' · vía link'
                        : recipe.source === 'imported'
                          ? ' · import'
                          : ''
                    }${recipe.deleted_at ? ' · eliminada' : ''}`}
              </p>
              <h1 className="mb-3 font-serif text-3xl leading-tight text-gray-900 lg:text-4xl">
                {recipe.recipe_name}
              </h1>
              {editId && (
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === 'diff' ? 'recipe' : 'diff'))}
                  className="mb-4 text-xs font-medium text-brand-honey underline-offset-2 hover:underline"
                >
                  {mode === 'diff' ? 'Ver receta completa →' : 'Ver cambios →'}
                </button>
              )}
              {mode === 'recipe' && recipe.comments?.trim() && (
                <p className="mb-2 font-serif text-sm italic text-gray-500">{recipe.comments}</p>
              )}

              <div className="my-6 border-t border-gray-200" />

              {mode === 'diff' ? (
                <RecipeDiffView history={history} editId={editId ?? ''} />
              ) : (
              <>
              {hasText && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.4fr]">
                  <div className="min-w-0">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                      Ingredientes
                    </h3>
                    <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-gray-700">
                      {isPlaceholder(recipe.ingredients) ? '—' : recipe.ingredients}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                      Preparación
                    </h3>
                    <div className="font-serif text-sm leading-[1.6] text-gray-700">
                      {isPlaceholder(recipe.instructions)
                        ? '—'
                        : recipe.instructions!.split('\n').map((line, i) =>
                            line.trim() === '' ? (
                              <div key={i} className="h-[1.6em]" />
                            ) : (
                              <p key={i} className="m-0">
                                {line}
                              </p>
                            )
                          )}
                    </div>
                  </div>
                </div>
              )}

              {showRaw && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Texto pegado
                  </h3>
                  <div className="whitespace-pre-wrap font-serif text-sm leading-[1.6] text-gray-700">
                    {recipe.raw_recipe_text}
                  </div>
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className={hasText || showRaw ? 'mt-8 border-t border-gray-200 pt-6' : ''}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Imágenes subidas
                    <span className="font-normal normal-case tracking-normal text-gray-400">
                      · click para abrir / descargar
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {uploadedImages.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Imagen subida ${i + 1}`}
                          className="w-full rounded-xl border border-gray-200 object-cover transition-colors group-hover:border-gray-400"
                        />
                        <span className="mt-1 block text-xs text-gray-400">
                          Imagen {i + 1} de {uploadedImages.length}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!hasText && !showRaw && uploadedImages.length === 0 && (
                <p className="text-sm text-gray-400">Esta receta no tiene contenido todavía.</p>
              )}
              </>
              )}
            </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

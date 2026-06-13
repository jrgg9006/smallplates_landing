'use client';

import { useEffect, useState } from 'react';

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
  upload_method: string | null;
  source: string | null;
  deleted_at: string | null;
  created_at: string;
  guests: RecipeGuest | null;
}

function guestLabel(g: RecipeGuest | null): string {
  if (!g) return 'Alguien';
  if (g.is_self) return 'El organizador';
  return [g.first_name, g.last_name].filter(Boolean).join(' ') || g.email || 'Invitado';
}

export function RecipeViewModal({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setRecipe(null);
    setError(null);
    fetch(`/api/v1/admin/content/recipes/${recipeId}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Receta no encontrada' : `Error ${res.status}`);
        return res.json();
      })
      .then((data) => active && setRecipe(data.recipe as RecipeData))
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

          {recipe && (
            <>
              {recipe.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={recipe.image_url}
                  alt={recipe.recipe_name}
                  className="mb-8 max-h-80 w-full rounded-xl object-cover"
                />
              )}

              <p className="mb-2 font-serif text-xs uppercase tracking-[0.2em] text-gray-400">
                {guestLabel(recipe.guests)}
                {recipe.source === 'collection'
                  ? ' · vía link'
                  : recipe.source === 'imported'
                    ? ' · import'
                    : ''}
                {recipe.deleted_at ? ' · eliminada' : ''}
              </p>
              <h1 className="mb-4 font-serif text-3xl leading-tight text-gray-900 lg:text-4xl">
                {recipe.recipe_name}
              </h1>
              {recipe.comments?.trim() && (
                <p className="mb-6 font-serif text-sm italic text-gray-500">{recipe.comments}</p>
              )}

              <div className="my-6 border-t border-gray-200" />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.4fr]">
                <div className="min-w-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Ingredientes
                  </h3>
                  <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-gray-700">
                    {recipe.ingredients?.trim() || '—'}
                  </p>
                </div>
                <div className="min-w-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Preparación
                  </h3>
                  <div className="font-serif text-sm leading-[1.6] text-gray-700">
                    {recipe.instructions?.trim()
                      ? recipe.instructions.split('\n').map((line, i) =>
                          line.trim() === '' ? (
                            <div key={i} className="h-[1.6em]" />
                          ) : (
                            <p key={i} className="m-0">
                              {line}
                            </p>
                          )
                        )
                      : '—'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

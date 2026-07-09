// app/(admin)/admin/delete/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import type { DeletableEntity } from '@/lib/admin/deletion/types';
import EntityTab, { EntityListItem } from './components/EntityTab';
import DeletePreviewSheet from './components/DeletePreviewSheet';
import TrashTab from './components/TrashTab';

type Tab = DeletableEntity | 'trash';

const TABS: { key: Tab; label: string }[] = [
  { key: 'group', label: 'Books' },
  { key: 'profile', label: 'Profiles' },
  { key: 'guest', label: 'Guests' },
  { key: 'recipe', label: 'Recipes' },
  { key: 'trash', label: '🗑️ Papelera' },
];

function DeletePortal() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'group');
  const [selected, setSelected] = useState<{ type: DeletableEntity; item: EntityListItem } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!isAdminEmail(user?.email)) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
    };
    check();
  }, [router]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Delete Portal</h1>
            <p className="text-gray-600 text-sm">
              El único lugar donde se borra. Todo pasa por papelera primero.
            </p>
          </div>
          <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Admin
          </Link>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'trash' ? (
          <TrashTab key={refreshKey} />
        ) : (
          <EntityTab
            key={`${tab}-${refreshKey}`}
            type={tab}
            initialQuery={searchParams.get('q') || ''}
            onSelect={(item) => setSelected({ type: tab, item })}
          />
        )}

        {selected && (
          <DeletePreviewSheet
            entityType={selected.type}
            entityId={selected.item.id}
            onClose={() => setSelected(null)}
            onTrashed={() => {
              setSelected(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminDeletePage() {
  // Reason: useSearchParams exige Suspense boundary en App Router
  return (
    <Suspense fallback={null}>
      <DeletePortal />
    </Suspense>
  );
}

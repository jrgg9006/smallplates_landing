"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';

export interface EditHistoryEntry {
  id: string;
  edited_at: string;
  edit_reason: string | null;
  edit_target: 'original' | 'print_ready' | null;
  recipe_name_before: string;
  ingredients_before: string;
  instructions_before: string;
  comments_before: string | null;
  recipe_name_after: string;
  ingredients_after: string;
  instructions_after: string;
  comments_after: string | null;
  profiles: { email: string; full_name: string | null } | null;
}

interface EditHistoryPanelProps {
  history: EditHistoryEntry[];
}

function DiffField({ label, before, after }: { label: string; before: string | null; after: string | null }) {
  if (before === after) return null;

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {before && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-1">
          <p className="text-xs text-red-800 whitespace-pre-wrap">{before}</p>
        </div>
      )}
      {after && (
        <div className="bg-green-50 border border-green-200 rounded p-2">
          <p className="text-xs text-green-800 whitespace-pre-wrap">{after}</p>
        </div>
      )}
    </div>
  );
}

export default function EditHistoryPanel({ history }: EditHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-4">
        No edits yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <Clock className="w-4 h-4" />
        Edit History ({history.length})
      </h4>
      {history.map((entry) => {
        const isExpanded = expandedId === entry.id;
        const editorName = entry.profiles?.full_name || entry.profiles?.email || 'Unknown';
        const date = new Date(entry.edited_at).toLocaleString();

        return (
          <div key={entry.id} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{date}</p>
                  {entry.edit_target && (
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.edit_target === 'print_ready'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.edit_target === 'print_ready' ? 'print ready' : 'original'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">by {editorName}</p>
                {entry.edit_reason && (
                  <p className="text-xs text-gray-600 mt-0.5 italic">
                    &quot;{entry.edit_reason}&quot;
                  </p>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 border-t bg-gray-50">
                <DiffField
                  label="Recipe Name"
                  before={entry.recipe_name_before}
                  after={entry.recipe_name_after}
                />
                <DiffField
                  label="Ingredients"
                  before={entry.ingredients_before}
                  after={entry.ingredients_after}
                />
                <DiffField
                  label="Instructions"
                  before={entry.instructions_before}
                  after={entry.instructions_after}
                />
                <DiffField
                  label="Comments"
                  before={entry.comments_before}
                  after={entry.comments_after}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

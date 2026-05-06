'use client';

import { useState, Fragment } from 'react';
import type { DebugLogRow } from '@/lib/types/database';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

// Reason: API enriches logs with _guest and _group from real DB lookups
// _is_synthetic marks orphan_recipe entries that are computed on-the-fly, not stored in DB
interface EnrichedDebugLog extends DebugLogRow {
  _guest?: { id: string; name: string | null } | null;
  _group?: { id: string; name: string | null } | null;
  _is_synthetic?: boolean;
}

interface DebugLogTableProps {
  logs: EnrichedDebugLog[];
  onMarkReviewed: (id: string) => void;
  onReopen: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
}

// Reason: different event_types store context in different shapes.
// This normalizes them into a consistent display format.
// Uses enriched _guest/_group from API when available, falls back to context.
function extractDisplayFields(log: EnrichedDebugLog) {
  const ctx = (log.context || {}) as Record<string, unknown>;
  const eventType = log.event_type;

  // Reason: prefer enriched DB data over context fields
  const guestName = log._guest?.name || (ctx.guestName as string) || (ctx.guest_name as string) || null;
  const guestId = log._guest?.id || null;
  const groupName = log._group?.name || null;
  const groupId = log._group?.id || null;

  if (eventType === 'analysis_failed') {
    const trace = ctx.pipeline_trace as Array<Record<string, unknown>> | undefined;
    const failedStep = trace?.find(s => s.status === 'error');
    return {
      recipeName: (ctx.recipe_name as string) || 'Unknown',
      guestName,
      guestId,
      groupName,
      groupId,
      errorSummary: failedStep
        ? `${failedStep.step}: ${String(failedStep.error || '').slice(0, 80)}...`
        : (ctx.error as string)?.slice(0, 100) || 'Analysis failed',
    };
  }

  if (eventType === 'recipe_missing_group_id') {
    return {
      recipeName: (ctx.recipeName as string) || 'Unknown',
      guestName,
      guestId,
      groupName,
      groupId,
      errorSummary: `${ctx.function || 'unknown'} — group_id was null${ctx.failsafe ? ` (${ctx.failsafe})` : ''}`,
    };
  }

  if (eventType === 'orphan_recipe') {
    return {
      recipeName: (ctx.recipe_name as string) || 'Unknown',
      guestName: (ctx.guest_name as string) || null,
      guestId: null,
      groupName: null,
      groupId: (ctx.group_id as string) || null,
      errorSummary: 'No está en group_recipes — invisible en Book Production',
    };
  }

  // Fallback for unknown event types
  return {
    recipeName: (ctx.recipe_name as string) || (ctx.recipeName as string) || '-',
    guestName,
    guestId,
    groupName,
    groupId,
    errorSummary: JSON.stringify(ctx).slice(0, 100),
  };
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DebugLogTable({ logs, onMarkReviewed, onReopen, onSaveNotes }: DebugLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No logs found.
      </div>
    );
  }

  const handleNotesChange = (id: string, value: string) => {
    setNotesMap(prev => ({ ...prev, [id]: value }));
  };

  const getNotesValue = (log: DebugLogRow) => {
    return notesMap[log.id] ?? log.admin_notes ?? '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Recipe</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Guest</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Group</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Error</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const fields = extractDisplayFields(log);
            const isReviewed = log.status === 'reviewed';

            return (
              <Fragment key={log.id}>
                <tr
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      log.event_type === 'analysis_failed'
                        ? 'bg-red-100 text-red-700'
                        : log.event_type === 'orphan_recipe'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{fields.recipeName}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900">{fields.guestName || '-'}</span>
                    {fields.guestId && (
                      <span className="block text-[10px] text-gray-400 font-mono">{fields.guestId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{fields.groupName || '-'}</span>
                    {fields.groupId && (
                      <span className="block text-[10px] text-gray-400 font-mono">{fields.groupId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[280px] break-words">{fields.errorSummary}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {log._is_synthetic ? (
                      <span className="text-xs text-orange-500 font-medium">Fix in DB</span>
                    ) : isReviewed ? (
                      <button
                        onClick={() => onReopen(log.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Reopen"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => onMarkReviewed(log.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="Mark as reviewed"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded detail row */}
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Full context JSON */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Full Context</h4>
                          <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>

                        {/* Admin notes */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin Notes</h4>
                          <textarea
                            value={getNotesValue(log)}
                            onChange={e => handleNotesChange(log.id, e.target.value)}
                            placeholder="Add notes about this issue..."
                            className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-honey/50 focus:border-brand-honey"
                          />
                          <button
                            onClick={() => onSaveNotes(log.id, getNotesValue(log))}
                            className="mt-2 px-4 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Save Notes
                          </button>

                          {/* Review metadata */}
                          {log.reviewed_at && (
                            <p className="mt-3 text-xs text-gray-400">
                              Reviewed {formatDate(log.reviewed_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

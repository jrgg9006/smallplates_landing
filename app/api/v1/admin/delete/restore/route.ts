// app/api/v1/admin/delete/restore/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { planRestore } from '@/lib/admin/deletion/restore-plan';
import { rowKey } from '@/lib/admin/deletion/order';
import type { SnapshotTables } from '@/lib/admin/deletion/types';

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const { trashId } = await request.json();
    if (!trashId) {
      return NextResponse.json({ error: 'trashId is required' }, { status: 400 });
    }
    const admin = createSupabaseAdminClient();

    const { data: item, error: itemError } = await admin
      .from('deleted_items')
      .select('*')
      .eq('id', trashId)
      .eq('status', 'trashed')
      .maybeSingle();
    if (itemError || !item) {
      return NextResponse.json({ error: 'No está en papelera (o ya fue restaurado/purgado)' }, { status: 404 });
    }
    const payload = item.payload as {
      tables: SnapshotTables;
      curatedLinks?: { id: string; origin_eval_id: string }[];
    } | null;
    if (!payload?.tables) {
      return NextResponse.json({ error: 'Snapshot vacío — no se puede restaurar' }, { status: 500 });
    }

    // Padre faltante: recipe necesita su group/guest vivos; guest necesita su group
    const missing: string[] = [];
    if (item.entity_type === 'recipe' || item.entity_type === 'guest') {
      const rootTable = item.entity_type === 'recipe' ? 'guest_recipes' : 'guests';
      const rootRow = payload.tables[rootTable]?.find((r) => String(r.id) === item.entity_id);
      const groupId = rootRow?.group_id ? String(rootRow.group_id) : null;
      if (groupId) {
        const { data: parentGroup } = await admin.from('groups').select('id').eq('id', groupId).maybeSingle();
        if (!parentGroup) missing.push(`groups/${groupId}`);
      }
      if (item.entity_type === 'recipe' && rootRow?.guest_id) {
        const { data: parentGuest } = await admin
          .from('guests').select('id').eq('id', String(rootRow.guest_id)).maybeSingle();
        if (!parentGuest) missing.push(`guests/${String(rootRow.guest_id)}`);
      }
    }
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Padre faltante: ${missing.join(', ')}. Restaura el padre primero (si está en papelera) o aborta.` },
        { status: 409 }
      );
    }

    // Conflictos: ids que ya existen vivos se omiten (nunca sobreescribimos)
    const existingIds: Record<string, Set<string>> = {};
    for (const [table, rows] of Object.entries(payload.tables)) {
      if (rows.length === 0) continue;
      const ids = rows.map((r) => r.id).filter((v): v is string => typeof v === 'string');
      if (ids.length > 0) {
        // Camino normal: la tabla tiene columna id (UUIDs)
        const { data: existing, error: selectError } = await admin.from(table).select('id').in('id', ids);
        if (selectError) {
          return NextResponse.json({ error: `Consulta de conflictos en ${table} falló: ${selectError.message}` }, { status: 500 });
        }
        existingIds[table] = new Set((existing || []).map((r) => rowKey(r as Record<string, unknown>)));
      } else {
        // Reason: tablas junction sin columna id (ej. group_members PK=group_id+profile_id,
        // group_recipes PK=group_id+recipe_id). Sin este bloque planRestore las considera
        // todas nuevas → INSERT falla con violación de PK compuesta en reintento.
        const firstRow = rows[0] as Record<string, unknown>;
        const idCols = Object.keys(firstRow).filter((k) => k.endsWith('_id'));
        if (idCols.length === 0) continue;
        const filterCol = idCols[0];
        const values = [...new Set(rows.map((r) => String((r as Record<string, unknown>)[filterCol])))];
        const { data: existing, error: selectError } = await admin.from(table).select('*').in(filterCol, values);
        if (selectError) {
          return NextResponse.json({ error: `Consulta de conflictos en ${table} falló: ${selectError.message}` }, { status: 500 });
        }
        existingIds[table] = new Set((existing || []).map((r) => rowKey(r as Record<string, unknown>)));
      }
    }

    const plan = planRestore(payload.tables, existingIds);
    const steps: string[] = [];

    if (item.entity_type === 'profile') {
      const { error: unbanError } = await admin.auth.admin.updateUserById(item.entity_id, {
        ban_duration: 'none',
      });
      if (unbanError) {
        return NextResponse.json({ error: `Unban falló: ${unbanError.message}` }, { status: 500 });
      }
      steps.push('✅ Auth user desbaneado');
    }

    for (const { table, rows } of plan.inserts) {
      const { error: insertError } = await admin.from(table).insert(rows);
      if (insertError) {
        return NextResponse.json(
          { error: `Insert en ${table} falló: ${insertError.message}. Filas ya insertadas quedan vivas — reintenta (los conflictos se omiten).`, steps },
          { status: 500 }
        );
      }
      steps.push(`✅ ${rows.length} fila(s) → ${table}`);

      // Reason: los triggers de groups INSERT (add_group_creator_as_owner,
      // create_group_cookbook) auto-crean membresía y cookbook nuevos. El snapshot
      // trae las filas reales — se limpian los artefactos del trigger antes de que
      // las tablas siguientes del RESTORE_ORDER inserten las originales.
      if (table === 'groups') {
        const groupIds = rows
          .map((r) => r.id)
          .filter((v): v is string => typeof v === 'string');
        if (groupIds.length > 0) {
          const { error: cleanMembersError } = await admin
            .from('group_members').delete().in('group_id', groupIds);
          if (cleanMembersError) {
            return NextResponse.json(
              { error: `Limpieza de membresías de trigger falló: ${cleanMembersError.message}`, steps },
              { status: 500 }
            );
          }
          const { error: cleanCookbooksError } = await admin
            .from('cookbooks').delete().in('group_id', groupIds);
          if (cleanCookbooksError) {
            return NextResponse.json(
              { error: `Limpieza de cookbooks de trigger falló: ${cleanCookbooksError.message}`, steps },
              { status: 500 }
            );
          }
          steps.push('🧹 Artefactos de triggers limpiados (membresía/cookbook auto-creados)');
        }
      }
    }

    // Reason: re-liga los curated examples desligados en el trash. Si el example
    // ya no existe, el update afecta 0 filas — inofensivo.
    for (const link of payload.curatedLinks || []) {
      const { error: relinkError } = await admin
        .from('curated_examples')
        .update({ origin_eval_id: link.origin_eval_id })
        .eq('id', link.id);
      if (!relinkError) steps.push(`🔗 curated example re-ligado (${link.id.slice(0, 8)}…)`);
    }

    await admin
      .from('deleted_items')
      .update({ status: 'restored', restored_at: new Date().toISOString() })
      .eq('id', trashId);
    steps.push('🗄️ Papelera: marcado como restaurado');

    return NextResponse.json({ success: true, steps, conflicts: plan.conflicts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}

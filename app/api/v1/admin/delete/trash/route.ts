// app/api/v1/admin/delete/trash/route.ts
import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildSnapshot } from '@/lib/admin/deletion/snapshot';
import type { DeletableEntity } from '@/lib/admin/deletion/types';

const VALID_TYPES: DeletableEntity[] = ['profile', 'group', 'guest', 'recipe'];

// Reason: ban de facto permanente — el auth user se conserva para que restore
// recupere la cuenta con su password; solo purge lo borra de verdad
const BAN_FOREVER = '876000h';

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminAuth();
    const body = await request.json();
    const entityType = body.entityType as DeletableEntity;
    const entityId = String(body.entityId || '');
    const confirmLabel = String(body.confirmLabel || '');
    const memberGroupsAction = body.memberGroupsAction as 'transfer' | 'delete' | undefined;

    if (!VALID_TYPES.includes(entityType) || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const steps: string[] = [];

    // Transferir grupos con members ajenos ANTES del snapshot: así el snapshot
    // ya no los incluye y sobreviven fuera del borrado.
    if (memberGroupsAction === 'transfer' && (entityType === 'profile' || entityType === 'group')) {
      const groupFilter =
        entityType === 'profile'
          ? admin.from('groups').select('id, created_by').eq('created_by', entityId)
          : admin.from('groups').select('id, created_by').eq('id', entityId);
      const { data: groups, error: groupsQueryError } = await groupFilter;
      if (groupsQueryError) {
        return NextResponse.json({ error: groupsQueryError.message }, { status: 500 });
      }
      let transferred = 0;
      for (const group of groups || []) {
        const { data: others, error: othersQueryError } = await admin
          .from('group_members')
          .select('profile_id')
          .eq('group_id', group.id)
          .neq('profile_id', group.created_by)
          .limit(1);
        if (othersQueryError) {
          return NextResponse.json({ error: othersQueryError.message }, { status: 500 });
        }
        if (others && others.length > 0) {
          const newOwner = String(others[0].profile_id);
          const { error: updateGroupError } = await admin
            .from('groups')
            .update({ created_by: newOwner })
            .eq('id', group.id);
          if (updateGroupError) {
            return NextResponse.json({ error: updateGroupError.message }, { status: 500 });
          }
          const { error: updateRoleError } = await admin
            .from('group_members')
            .update({ role: 'owner' })
            .eq('group_id', group.id)
            .eq('profile_id', newOwner);
          if (updateRoleError) {
            // Reason: revertir created_by para no dejar ownership inconsistente
            await admin.from('groups').update({ created_by: group.created_by }).eq('id', group.id);
            return NextResponse.json({ error: updateRoleError.message }, { status: 500 });
          }
          steps.push(`🔄 Grupo transferido a otro miembro (${group.id})`);
          transferred++;
        }
      }
      if (entityType === 'group') {
        if (transferred === 0) {
          return NextResponse.json(
            { error: 'No hay miembros ajenos a quien transferir — el grupo no fue modificado. Usa memberGroupsAction: "delete" o quita el parámetro.' },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: true, trashId: null, steps });
      }
    }

    const snapshot = await buildSnapshot(admin, entityType, entityId);

    if (snapshot.entityLabel !== confirmLabel) {
      return NextResponse.json({ error: 'La confirmación escrita no coincide' }, { status: 400 });
    }
    if (snapshot.protection.blocked) {
      return NextResponse.json(
        { error: `Protegido: ${snapshot.protection.reasons.join('; ')}` },
        { status: 403 }
      );
    }
    if (snapshot.protection.memberChoiceRequired && !memberGroupsAction) {
      return NextResponse.json(
        { error: 'Hay miembros ajenos: manda memberGroupsAction transfer|delete', warnings: snapshot.protection.warnings },
        { status: 409 }
      );
    }
    steps.push(`📸 Snapshot de ${Object.values(snapshot.counts).reduce((a, b) => a + b, 0)} filas`);

    const { data: trashRow, error: archiveError } = await admin
      .from('deleted_items')
      .insert({
        entity_type: snapshot.entityType,
        entity_id: snapshot.entityId,
        entity_label: snapshot.entityLabel,
        payload: { tables: snapshot.tables, protection: snapshot.protection, curatedLinks: snapshot.curatedLinks },
        counts: snapshot.counts,
        deleted_by: adminUser.id,
      })
      .select('id')
      .single();
    if (archiveError || !trashRow) {
      return NextResponse.json({ error: `Archivado falló: ${archiveError?.message}` }, { status: 500 });
    }
    steps.push('🗄️ Archivado en papelera');

    // Borrado real. Cada DELETE de raíz es atómico (las cascadas FK van en el
    // mismo statement). Si falla, limpiamos la fila de papelera huérfana
    // y re-ligamos los curated examples que ya se hubieran desligado.
    let unlinked = false;
    const fail = async (message: string) => {
      if (unlinked) {
        for (const link of snapshot.curatedLinks) {
          await admin.from('curated_examples').update({ origin_eval_id: link.origin_eval_id }).eq('id', link.id);
        }
      }
      await admin.from('deleted_items').delete().eq('id', trashRow.id);
      return NextResponse.json({ error: message }, { status: 500 });
    };

    // Reason: curated_examples referencian prompt_evaluations con FK NO ACTION —
    // sin desligar, el DELETE truena. Son autocontenidos: sobreviven sin la referencia
    // y el restore la re-liga (los links viajan en el payload).
    if (snapshot.curatedLinks.length > 0) {
      const { error: unlinkError } = await admin
        .from('curated_examples')
        .update({ origin_eval_id: null })
        .in('id', snapshot.curatedLinks.map((l) => l.id));
      if (unlinkError) return fail(`Desligar curated examples falló: ${unlinkError.message}`);
      unlinked = true;
      steps.push(`🔗 ${snapshot.curatedLinks.length} curated example(s) desligados (se conservan)`);
    }

    if (entityType === 'profile') {
      const { error: banError } = await admin.auth.admin.updateUserById(entityId, {
        ban_duration: BAN_FOREVER,
      });
      if (banError) return fail(`Ban del auth user falló: ${banError.message}`);
      steps.push('🚫 Auth user baneado (email reservado, restore posible)');
    }

    if (entityType === 'group') {
      // Reason: guests.group_id es SET NULL — se borran explícitamente
      // para no dejarlos huérfanos (decisión de la spec)
      const { error: guestsError } = await admin.from('guests').delete().eq('group_id', entityId);
      if (guestsError) return fail(`Borrado de guests falló: ${guestsError.message}`);
      steps.push('🗑️ Guests del grupo borrados');
    }

    const ROOT_TABLE: Record<DeletableEntity, string> = {
      profile: 'profiles',
      group: 'groups',
      guest: 'guests',
      recipe: 'guest_recipes',
    };
    const { error: deleteError } = await admin.from(ROOT_TABLE[entityType]).delete().eq('id', entityId);
    if (deleteError) {
      if (entityType === 'profile') {
        await admin.auth.admin.updateUserById(entityId, { ban_duration: 'none' });
      }
      return fail(`DELETE bloqueado o falló: ${deleteError.message}`);
    }
    steps.push(`🗑️ ${ROOT_TABLE[entityType]} borrado (cascada atómica)`);

    return NextResponse.json({ success: true, trashId: trashRow.id, steps });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: message.includes('Admin') ? 401 : 500 });
  }
}

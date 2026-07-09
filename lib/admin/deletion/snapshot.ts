// lib/admin/deletion/snapshot.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeletableEntity, DeletionSnapshot, SnapshotTables } from './types';
import { buildCounts, mergeTables } from './order';
import { evaluateProtection } from './protection';

// Reason: tablas hijas de guest_recipes con FK CASCADE (mapa verificado en la spec)
const RECIPE_CHILD_TABLES = [
  'cookbook_recipes',
  'group_recipes',
  'image_processing_queue',
  'midjourney_prompts',
  'prompt_evaluations',
  'recipe_annex_images',
  'recipe_edit_history',
  'recipe_print_ready',
  'recipe_production_status',
] as const;

type Row = Record<string, unknown>;

async function fetchAll(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[]
): Promise<Row[]> {
  if (values.length === 0) return [];
  const { data, error } = await admin.from(table).select('*').in(column, values);
  if (error) throw new Error(`snapshot ${table}: ${error.message}`);
  return (data as Row[]) || [];
}

async function recipeChildren(admin: SupabaseClient, recipeIds: string[]): Promise<SnapshotTables> {
  const tables: SnapshotTables = {};
  for (const table of RECIPE_CHILD_TABLES) {
    tables[table] = await fetchAll(admin, table, 'recipe_id', recipeIds);
  }
  return tables;
}

async function groupContent(admin: SupabaseClient, groupIds: string[]): Promise<SnapshotTables> {
  let tables: SnapshotTables = {
    guests: await fetchAll(admin, 'guests', 'group_id', groupIds),
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'group_id', groupIds),
    group_members: await fetchAll(admin, 'group_members', 'group_id', groupIds),
    group_invitations: await fetchAll(admin, 'group_invitations', 'group_id', groupIds),
    group_recipes: await fetchAll(admin, 'group_recipes', 'group_id', groupIds),
    cookbooks: await fetchAll(admin, 'cookbooks', 'group_id', groupIds),
    book_qa_reviews: await fetchAll(admin, 'book_qa_reviews', 'group_id', groupIds),
    recipe_annex_images: await fetchAll(admin, 'recipe_annex_images', 'group_id', groupIds),
  };
  const recipeIds = tables.guest_recipes.map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, recipeIds));
  const cookbookIds = tables.cookbooks.map((c) => String(c.id));
  tables = mergeTables(tables, {
    cookbook_recipes: await fetchAll(admin, 'cookbook_recipes', 'cookbook_id', cookbookIds),
  });
  return tables;
}

async function ownerIsTest(admin: SupabaseClient, profileId: string | null): Promise<boolean> {
  if (!profileId) return false;
  const { data } = await admin
    .from('profiles')
    .select('is_test_account')
    .eq('id', profileId)
    .maybeSingle();
  return Boolean(data?.is_test_account);
}

async function countOrders(
  admin: SupabaseClient,
  column: 'group_id' | 'user_id',
  values: string[]
): Promise<{ total: number; paid: number }> {
  if (values.length === 0) return { total: 0, paid: 0 };
  const rows = await fetchAll(admin, 'orders', column, values);
  const paid = rows.filter((o) => o.status === 'paid' || o.status === 'completed').length;
  return { total: rows.length, paid };
}

export async function buildSnapshot(
  admin: SupabaseClient,
  entityType: DeletableEntity,
  entityId: string
): Promise<DeletionSnapshot> {
  if (entityType === 'recipe') return snapshotRecipe(admin, entityId);
  if (entityType === 'guest') return snapshotGuest(admin, entityId);
  if (entityType === 'group') return snapshotGroup(admin, entityId);
  return snapshotProfile(admin, entityId);
}

async function root(admin: SupabaseClient, table: string, id: string): Promise<Row> {
  const { data, error } = await admin.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`snapshot ${table}: ${error.message}`);
  if (!data) throw new Error('Not found');
  return data as Row;
}

async function snapshotRecipe(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const recipe = await root(admin, 'guest_recipes', id);
  const tables = mergeTables({ guest_recipes: [recipe] }, await recipeChildren(admin, [id]));
  const protection = evaluateProtection({
    entityType: 'recipe',
    orderCount: 0,
    paidOrderCount: 0,
    shippingCount: 0,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, recipe.user_id ? String(recipe.user_id) : null),
    otherMemberCount: 0,
  });
  return {
    entityType: 'recipe',
    entityId: id,
    entityLabel: String(recipe.recipe_name || 'Untitled recipe'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotGuest(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const guest = await root(admin, 'guests', id);
  let tables: SnapshotTables = {
    guests: [guest],
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'guest_id', [id]),
    communication_log: await fetchAll(admin, 'communication_log', 'guest_id', [id]),
  };
  const recipeIds = tables.guest_recipes.map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, recipeIds));
  const protection = evaluateProtection({
    entityType: 'guest',
    orderCount: 0,
    paidOrderCount: 0,
    shippingCount: 0,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, guest.user_id ? String(guest.user_id) : null),
    otherMemberCount: 0,
  });
  const name = [guest.first_name, guest.last_name].filter(Boolean).join(' ');
  return {
    entityType: 'guest',
    entityId: id,
    entityLabel: name || String(guest.email || 'Unnamed guest'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotGroup(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const group = await root(admin, 'groups', id);
  const tables = mergeTables({ groups: [group] }, await groupContent(admin, [id]));
  const orders = await countOrders(admin, 'group_id', [id]);
  const shipping = await fetchAll(admin, 'shipping_addresses', 'group_id', [id]);
  const ownerId = group.created_by ? String(group.created_by) : null;
  const otherMembers = (tables.group_members || []).filter(
    (m) => String(m.profile_id) !== ownerId
  );
  const protection = evaluateProtection({
    entityType: 'group',
    orderCount: orders.total,
    paidOrderCount: orders.paid,
    shippingCount: shipping.length,
    qaReviewCount: 0,
    isTestOwner: await ownerIsTest(admin, ownerId),
    otherMemberCount: otherMembers.length,
  });
  return {
    entityType: 'group',
    entityId: id,
    entityLabel: String(group.name || 'Unnamed group'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

async function snapshotProfile(admin: SupabaseClient, id: string): Promise<DeletionSnapshot> {
  const profile = await root(admin, 'profiles', id);
  const ownedGroups = await fetchAll(admin, 'groups', 'created_by', [id]);
  const groupIds = ownedGroups.map((g) => String(g.id));
  let tables: SnapshotTables = mergeTables(
    { profiles: [profile], groups: ownedGroups },
    await groupContent(admin, groupIds)
  );
  tables = mergeTables(tables, {
    guests: await fetchAll(admin, 'guests', 'user_id', [id]),
    guest_recipes: await fetchAll(admin, 'guest_recipes', 'user_id', [id]),
    cookbooks: await fetchAll(admin, 'cookbooks', 'user_id', [id]),
    cookbook_recipes: await fetchAll(admin, 'cookbook_recipes', 'user_id', [id]),
    communication_log: await fetchAll(admin, 'communication_log', 'user_id', [id]),
    group_members: await fetchAll(admin, 'group_members', 'profile_id', [id]),
    group_invitations: await fetchAll(admin, 'group_invitations', 'invited_by', [id]),
    group_recipes: await fetchAll(admin, 'group_recipes', 'added_by', [id]),
  });
  const extraRecipeIds = (tables.guest_recipes || []).map((r) => String(r.id));
  tables = mergeTables(tables, await recipeChildren(admin, extraRecipeIds));

  const ordersByUser = await countOrders(admin, 'user_id', [id]);
  const ordersByGroup = await countOrders(admin, 'group_id', groupIds);
  const qaReviews = await fetchAll(admin, 'book_qa_reviews', 'created_by', [id]);
  const otherMembers = (tables.group_members || []).filter((m) => String(m.profile_id) !== id);

  const protection = evaluateProtection({
    entityType: 'profile',
    orderCount: ordersByUser.total + ordersByGroup.total,
    paidOrderCount: ordersByUser.paid + ordersByGroup.paid,
    shippingCount: 0,
    qaReviewCount: qaReviews.length,
    isTestOwner: Boolean(profile.is_test_account),
    otherMemberCount: otherMembers.length,
  });
  return {
    entityType: 'profile',
    entityId: id,
    entityLabel: String(profile.email || 'Unknown profile'),
    tables,
    counts: buildCounts(tables),
    protection,
  };
}

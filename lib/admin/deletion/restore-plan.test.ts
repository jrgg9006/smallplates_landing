import { planRestore } from './restore-plan';

describe('planRestore', () => {
  const tables = {
    guest_recipes: [{ id: 'r1' }, { id: 'r2' }],
    groups: [{ id: 'g1' }],
    recipe_print_ready: [{ id: 'pr1', recipe_id: 'r1' }],
  };

  it('ordena los inserts padres-primero', () => {
    const plan = planRestore(tables, {});
    const order = plan.inserts.map((i) => i.table);
    expect(order.indexOf('groups')).toBeLessThan(order.indexOf('guest_recipes'));
    expect(order.indexOf('guest_recipes')).toBeLessThan(order.indexOf('recipe_print_ready'));
  });

  it('separa conflictos y no los incluye en inserts', () => {
    const plan = planRestore(tables, { guest_recipes: new Set(['r1']) });
    const recipes = plan.inserts.find((i) => i.table === 'guest_recipes');
    expect(recipes?.rows.map((r) => r.id)).toEqual(['r2']);
    expect(plan.conflicts).toEqual([{ table: 'guest_recipes', ids: ['r1'] }]);
  });

  it('omite tablas vacías y desconocidas sin romper', () => {
    const plan = planRestore({ unknown_table: [{ id: 'x' }], orders: [] }, {});
    expect(plan.inserts.find((i) => i.table === 'orders')).toBeUndefined();
    // Reason: tabla fuera de RESTORE_ORDER se inserta al final, no se pierde
    expect(plan.inserts.find((i) => i.table === 'unknown_table')).toBeDefined();
  });
});

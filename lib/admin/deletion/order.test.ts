import { RESTORE_ORDER, buildCounts, mergeTables, rowKey } from './order';

describe('RESTORE_ORDER', () => {
  it('inserta padres antes que hijos', () => {
    // Reason: RESTORE_ORDER es `as const` — se ensancha para poder indexar con string
    const idx = (t: string) => (RESTORE_ORDER as readonly string[]).indexOf(t);
    expect(idx('profiles')).toBeLessThan(idx('groups'));
    expect(idx('groups')).toBeLessThan(idx('guests'));
    expect(idx('guests')).toBeLessThan(idx('guest_recipes'));
    expect(idx('groups')).toBeLessThan(idx('cookbooks'));
    expect(idx('cookbooks')).toBeLessThan(idx('cookbook_recipes'));
    expect(idx('guest_recipes')).toBeLessThan(idx('cookbook_recipes'));
    expect(idx('guest_recipes')).toBeLessThan(idx('recipe_print_ready'));
  });
});

describe('buildCounts', () => {
  it('cuenta filas por tabla, omitiendo tablas vacías', () => {
    expect(buildCounts({ guests: [{ id: 'a' }, { id: 'b' }], orders: [] }))
      .toEqual({ guests: 2 });
  });
});

describe('mergeTables', () => {
  it('concatena y dedupea por id', () => {
    const merged = mergeTables(
      { guests: [{ id: 'a' }] },
      { guests: [{ id: 'a' }, { id: 'b' }], groups: [{ id: 'g1' }] }
    );
    expect(merged.guests).toHaveLength(2);
    expect(merged.groups).toHaveLength(1);
  });

  it('dedupea filas sin id por clave compuesta', () => {
    const row = { group_id: 'g', profile_id: 'p' };
    const merged = mergeTables({ group_members: [row] }, { group_members: [{ ...row }] });
    expect(merged.group_members).toHaveLength(1);
  });
});

describe('rowKey', () => {
  it('usa id si existe, si no una clave compuesta estable', () => {
    expect(rowKey({ id: 'x', group_id: 'g' })).toBe('x');
    expect(rowKey({ group_id: 'g', profile_id: 'p' }))
      .toBe(rowKey({ profile_id: 'p', group_id: 'g' }));
  });
});

import { evaluateProtection } from './protection';

const base = {
  entityType: 'group' as const,
  orderCount: 0,
  paidOrderCount: 0,
  shippingCount: 0,
  qaReviewCount: 0,
  isTestOwner: true,
  otherMemberCount: 0,
};

describe('evaluateProtection', () => {
  it('sin nada raro: no bloqueado, purga permitida si owner es test', () => {
    const p = evaluateProtection(base);
    expect(p.blocked).toBe(false);
    expect(p.purgeAllowed).toBe(true);
  });

  it('orders bloquean el trash (FK NO ACTION)', () => {
    const p = evaluateProtection({ ...base, orderCount: 2, paidOrderCount: 2 });
    expect(p.blocked).toBe(true);
    expect(p.reasons.join(' ')).toContain('order');
  });

  it('shipping addresses bloquean el trash de un group', () => {
    const p = evaluateProtection({ ...base, shippingCount: 1 });
    expect(p.blocked).toBe(true);
  });

  it('qa reviews bloquean el trash de un profile', () => {
    const p = evaluateProtection({ ...base, entityType: 'profile', qaReviewCount: 1 });
    expect(p.blocked).toBe(true);
  });

  it('owner no-test: trash OK pero purga NO', () => {
    const p = evaluateProtection({ ...base, isTestOwner: false });
    expect(p.blocked).toBe(false);
    expect(p.purgeAllowed).toBe(false);
  });

  it('pagado = purga jamás, aunque sea test', () => {
    // Reason: no debería llegar a papelera con orders (blocked), pero la regla
    // "pagado > test flag" se evalúa igual por si el snapshot es viejo
    const p = evaluateProtection({ ...base, paidOrderCount: 1, orderCount: 0 });
    expect(p.purgeAllowed).toBe(false);
  });

  it('members ajenos generan warning, no bloqueo', () => {
    const p = evaluateProtection({ ...base, entityType: 'profile', otherMemberCount: 1 });
    expect(p.blocked).toBe(false);
    expect(p.warnings.length).toBeGreaterThan(0);
  });
});

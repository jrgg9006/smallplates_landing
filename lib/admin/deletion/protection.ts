import type { DeletableEntity, Protection } from './types';

export interface ProtectionInput {
  entityType: DeletableEntity;
  orderCount: number;
  paidOrderCount: number;
  shippingCount: number;
  qaReviewCount: number;
  isTestOwner: boolean;
  otherMemberCount: number;
  inProductionBookCount: number;
}

export function evaluateProtection(input: ProtectionInput): Protection {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (input.orderCount > 0) {
    reasons.push(`Tiene ${input.orderCount} order(s) — la base bloquea el borrado (FK NO ACTION)`);
  }
  if (input.shippingCount > 0) {
    reasons.push(`Tiene ${input.shippingCount} shipping address(es) — la base bloquea el borrado`);
  }
  if (input.entityType === 'profile' && input.qaReviewCount > 0) {
    reasons.push(`Creó ${input.qaReviewCount} QA review(s) — la base bloquea el borrado`);
  }
  if (input.otherMemberCount > 0) {
    warnings.push(
      `Hay ${input.otherMemberCount} miembro(s) ajeno(s) en grupos afectados — elige transferir o borrar completo`
    );
  }
  if (input.inProductionBookCount > 0) {
    warnings.push(
      `Tiene recetas en ${input.inProductionBookCount} libro(s) en revisión/producción — borrar puede afectar un libro por imprimir`
    );
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    warnings,
    // Reason: pagado > test flag (regla de la spec). Purga solo TEST y sin pagos.
    purgeAllowed: input.isTestOwner && input.paidOrderCount === 0,
    // Reason: el radio transfer/delete solo tiene sentido cuando hay grupos con
    // miembros ajenos — un warning de libro en producción no requiere elegir acción.
    memberChoiceRequired: input.otherMemberCount > 0,
  };
}

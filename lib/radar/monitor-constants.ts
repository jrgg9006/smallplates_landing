// lib/radar/monitor-constants.ts
// Reason: single source for the monitor's tunable thresholds (approved 2026-07-27).
export const COLDNESS_CANDIDATE_DAYS = 5;
export const DEADLINE_NEAR_DAYS = 10;
export const MOMENTUM_STALL_DAYS = 10;
export const ATTENDED_COOLDOWN_DAYS = 4;
export const PRINT_GOAL = 25;
export const DAY_MS = 1000 * 60 * 60 * 24;

// Let-go triage thresholds (balanced policy, approved 2026-07-28).
export const LETGO_COLD_NO_INVESTMENT_DAYS = 40;
export const LETGO_COLD_WITH_INVESTMENT_DAYS = 60;
export const LETGO_DEADLINE_PASSED_COLD_DAYS = 21;

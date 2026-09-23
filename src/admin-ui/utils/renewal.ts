const DAY_MS = 24 * 3600 * 1000;

/**
 * Computes the next renewal date from a billing cycle length in days.
 * Must stay in sync with the backend's renewal calculation (server-side
 * `utils/renewal`): 27-32 days -> +1 calendar month, 87-95 -> +3 months,
 * 175-185 -> +6 months, 360-370 -> +1 year, 720-750 -> +2 years,
 * 1080-1150 -> +3 years, 1800-1850 -> +5 years, anything else -> +N days.
 */
export function computeRenewalDate(
  expiredAt: Date,
  billingCycle: number,
): Date | null {
  if (!billingCycle || billingCycle <= 0) return null;
  const now = new Date();
  let base = new Date(expiredAt);
  if (expiredAt.getTime() < now.getTime() - 30 * DAY_MS) {
    base = now;
  }
  const result = new Date(base);
  if (billingCycle >= 27 && billingCycle <= 32) {
    result.setMonth(result.getMonth() + 1);
  } else if (billingCycle >= 87 && billingCycle <= 95) {
    result.setMonth(result.getMonth() + 3);
  } else if (billingCycle >= 175 && billingCycle <= 185) {
    result.setMonth(result.getMonth() + 6);
  } else if (billingCycle >= 360 && billingCycle <= 370) {
    result.setFullYear(result.getFullYear() + 1);
  } else if (billingCycle >= 720 && billingCycle <= 750) {
    result.setFullYear(result.getFullYear() + 2);
  } else if (billingCycle >= 1080 && billingCycle <= 1150) {
    result.setFullYear(result.getFullYear() + 3);
  } else if (billingCycle >= 1800 && billingCycle <= 1850) {
    result.setFullYear(result.getFullYear() + 5);
  } else {
    result.setDate(result.getDate() + billingCycle);
  }
  return result;
}

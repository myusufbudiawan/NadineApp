const MESSAGES = [
  "Keep going — you're doing an amazing job.",
  "Every small step counts. You've got this.",
  "Your care matters more than you know.",
  "Rest when you can. You're not doing this alone.",
  "One day at a time — you're doing great.",
  "Your baby is lucky to have someone as devoted as you.",
  "It's okay to take things slow. You're doing enough.",
  "Trust yourself — you know your baby best.",
];

// Same message all day, a new one tomorrow — picked from the day count
// since epoch, so no state to store. Flips at UTC midnight rather than the
// caregiver's local midnight; close enough for a rotating quote.
export function getDailyEncouragement(now = new Date()): string {
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return MESSAGES[dayIndex % MESSAGES.length];
}

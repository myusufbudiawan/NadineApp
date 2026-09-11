// Time-of-day greeting for the home header. The two overnight windows get
// their own copy instead of falling under "evening" — a caregiver awake at
// 2am is in a different situation than one awake at 9pm.
export function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 3) return 'Still up?';
  if (hour < 5) return 'Up early';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

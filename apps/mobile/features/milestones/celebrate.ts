import { MilestoneId } from './types';

// A tiny app-wide queue: any screen can ask for a celebration, and the one
// <CelebrationHost /> mounted at the root plays them one after another over
// the whole app (several can land at once, e.g. auto-detection noticing
// "back to birth weight" and "reached 2 kg" from the same weigh-in).
type Listener = (queue: MilestoneId[]) => void;
let queue: MilestoneId[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(queue));
}

export function requestCelebration(id: MilestoneId) {
  if (queue.includes(id)) return;
  queue = [...queue, id];
  emit();
}

export function finishCelebration(id: MilestoneId) {
  queue = queue.filter((q) => q !== id);
  emit();
}

export function subscribeToCelebrations(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue);
  return () => listeners.delete(listener);
}

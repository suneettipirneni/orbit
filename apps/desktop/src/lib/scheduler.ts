import { addDays } from "./time.js";

export interface SchedulingState {
  dueAt: string;
  easeFactor: number;
  intervalDays: number;
  lapses: number;
  repetitions: number;
}

export interface SchedulingResult extends SchedulingState {
  nextDueAt: string;
}

export function scheduleReview(
  state: SchedulingState,
  rating: 1 | 2 | 3 | 4 | 5,
  now = new Date(),
): SchedulingResult {
  if (rating < 3) {
    const lapses = state.lapses + 1;
    const nextDueAt = addDays(now, 1).toISOString();

    return {
      dueAt: nextDueAt,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 1,
      lapses,
      nextDueAt,
      repetitions: 0,
    };
  }

  const quality = rating;
  const easeFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );
  const repetitions = state.repetitions + 1;
  const intervalDays =
    repetitions === 1
      ? 1
      : repetitions === 2
        ? 6
        : Math.max(1, Math.round(state.intervalDays * easeFactor));
  const nextDueAt = addDays(now, intervalDays).toISOString();

  return {
    dueAt: nextDueAt,
    easeFactor,
    intervalDays,
    lapses: state.lapses,
    nextDueAt,
    repetitions,
  };
}

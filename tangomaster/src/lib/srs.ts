// SuperMemo-2 Implementation for Spaced Repetition

interface SRSResult {
  interval: number; // in days
  repetition: number;
  easeFactor: number;
}

export const calculateSRS = (
  quality: number, // 0-5 rating
  previousInterval: number,
  previousRepetition: number,
  previousEaseFactor: number
): SRSResult => {
  let interval = 0;
  let repetition = previousRepetition;
  let easeFactor = previousEaseFactor;

  if (quality >= 3) {
    if (previousRepetition === 0) {
      interval = 1;
    } else if (previousRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * previousEaseFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { interval, repetition, easeFactor };
};

// Helper for "Next Review Date"
export const getNextReviewDate = (intervalDays: number): number => {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now.getTime();
};

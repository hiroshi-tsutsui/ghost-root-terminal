export const calculateStreak = (history: number[]): number => {
  // logic to calculate consecutive days
  // simplified
  return history.length;
};

export const canUseStreakFreeze = (lastPracticeTime: number, freezeInventory: number): boolean => {
  const now = Date.now();
  const dayInMillis = 24 * 60 * 60 * 1000;
  const daysSince = (now - lastPracticeTime) / dayInMillis;
  
  // If missed a day (between 24h and 48h ago) and has inventory
  return daysSince > 1 && daysSince < 2 && freezeInventory > 0;
};

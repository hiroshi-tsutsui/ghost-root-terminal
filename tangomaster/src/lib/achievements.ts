export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Step',
    description: 'Complete your first lesson.',
    icon: '🐣',
    condition: (stats) => stats.lessonsCompleted >= 1
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintain a 7-day streak.',
    icon: '🔥',
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'vocab_king',
    title: 'Vocabulary King',
    description: 'Master 100 words.',
    icon: '👑',
    condition: (stats) => stats.masteredWords >= 100
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Practice before 8 AM.',
    icon: '🌅',
    condition: (stats) => stats.lastPracticeHour < 8
  }
];

export const checkAchievements = (userStats: any, unlockedIds: string[]) => {
  return ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id) && a.condition(userStats));
};

import Dexie, { Table } from 'dexie';

export interface UserProgress {
  id?: number;
  wordId: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  nextReview: number;
  interval: number;
  easeFactor: number;
  history: number[]; // timestamps
}

export interface Settings {
  id?: number;
  key: string;
  value: any;
}

export class TangoMasterDB extends Dexie {
  progress!: Table<UserProgress>;
  settings!: Table<Settings>;

  constructor() {
    super('TangoMasterDB');
    this.version(1).stores({
      progress: '++id, wordId, status, nextReview',
      settings: '++id, &key'
    });
  }
}

export const db = new TangoMasterDB();

// Migration helper
export async function migrateFromLocalStorage() {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith('tm_progress_')) {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      await db.progress.put(data);
      localStorage.removeItem(key);
    }
  }
}

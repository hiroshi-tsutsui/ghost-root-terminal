import { db } from './db';

interface SyncItem {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

export const addToSyncQueue = async (url: string, method: string, body: any) => {
  const item: SyncItem = {
    id: crypto.randomUUID(),
    url,
    method,
    body,
    timestamp: Date.now(),
  };
  // Ideally this goes into a separate Dexie table, simplified here
  localStorage.setItem(`sync_${item.id}`, JSON.stringify(item));
};

export const processSyncQueue = async () => {
  if (!navigator.onLine) return;

  const keys = Object.keys(localStorage).filter(k => k.startsWith('sync_'));
  for (const key of keys) {
    const item: SyncItem = JSON.parse(localStorage.getItem(key)!);
    try {
      // Mock fetch
      console.log(`Syncing ${item.url}...`);
      // await fetch(item.url, { method: item.method, body: JSON.stringify(item.body) });
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Sync failed', e);
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', processSyncQueue);
}

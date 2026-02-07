import { db } from './db';

export const exportUserData = async () => {
  const progress = await db.progress.toArray();
  const settings = await db.settings.toArray();
  
  const blob = new Blob([JSON.stringify({ progress, settings })], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `tangomaster_backup_${Date.now()}.json`;
  a.click();
};

export const importUserData = async (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.progress) {
      await db.progress.clear();
      await db.progress.bulkAdd(data.progress);
    }
    if (data.settings) {
      await db.settings.clear();
      await db.settings.bulkAdd(data.settings);
    }
    alert('Import successful!');
    window.location.reload();
  } catch (e) {
    console.error(e);
    alert('Import failed.');
  }
};

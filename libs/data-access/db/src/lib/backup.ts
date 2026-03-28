import { db } from '@storee/data-access-db';

export interface StoreeBackup {
  version: 1;
  exported_at: number;
  locations: unknown[];
  objects: unknown[];
  objectHistory: unknown[];
  settings: unknown[];
}

export async function exportAll(): Promise<void> {
  const backup: StoreeBackup = {
    version: 1,
    exported_at: Date.now(),
    locations: await db.locations.toArray(),
    objects: await db.objects.toArray(),
    objectHistory: await db.objectHistory.toArray(),
    settings: await db.settings.toArray(),
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storee-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importAll(file: File): Promise<void> {
  const text = await file.text();
  const backup: StoreeBackup = JSON.parse(text);
  if (backup.version !== 1) throw new Error('Unsupported backup version');

  await db.transaction(
    'rw',
    db.locations,
    db.objects,
    db.objectHistory,
    db.settings,
    async () => {
      await db.locations.clear();
      await db.objects.clear();
      await db.objectHistory.clear();
      await db.settings.clear();
      await db.locations.bulkAdd(backup.locations as never[]);
      await db.objects.bulkAdd(backup.objects as never[]);
      await db.objectHistory.bulkAdd(backup.objectHistory as never[]);
      await db.settings.bulkAdd(backup.settings as never[]);
    },
  );
}

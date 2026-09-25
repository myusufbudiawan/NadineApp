import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadDashboardMetrics, saveDashboardMetrics } from '@/features/dashboard/preferences';
import { CareEventType } from '@/features/care-events/types';
import { cancelReminderNotification } from '@/features/reminders/notifications';
import { rescheduleEnabledReminders } from '@/features/reminders/storage';
import { clearOnboarded } from '@/lib/auth/onboardingState';
import { confirmDestructive } from '@/lib/confirm';
import { getDatabase, listReminders, resetLocalData } from './database';
import {
  Backup,
  BACKUP_APP,
  BACKUP_TABLES,
  BACKUP_VERSION,
  BackupRow,
  validateBackup,
} from './backupFormat';

// Local JSON backup — the offline-only build's way to move a baby's data to
// another device (export here, import there). Covers every local table
// except the sync bookkeeping (mutation_queue, sync_conflicts).

async function buildBackup(): Promise<Backup> {
  const database = await getDatabase();
  const tables: Record<string, BackupRow[]> = {};
  for (const name of Object.keys(BACKUP_TABLES)) {
    tables[name] = await database.getAllAsync<BackupRow>(`SELECT * FROM ${name}`);
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
    prefs: { dashboardMetrics: await loadDashboardMetrics() },
  };
}

export async function exportBackup(): Promise<void> {
  const backup = await buildBackup();
  const file = new File(Paths.cache, `preemietrack-backup-${backup.exportedAt.slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save PreemieTrack backup',
  });
}

// Replace-all: wipes local data and loads the backup in one transaction, so
// a failure part-way leaves the device's existing data untouched.
export async function importBackup(json: unknown): Promise<void> {
  const backup = validateBackup(json);
  const previousReminders = await listReminders(LOCAL_BABY_ID);

  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await resetLocalData();
    for (const [name, { columns }] of Object.entries(BACKUP_TABLES)) {
      const sql = `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of backup.tables[name]) {
        const values = columns.map((c) =>
          name === 'reminders' && c === 'notification_id' ? null : (row[c] ?? null),
        );
        await database.runAsync(sql, values);
      }
    }
  });

  for (const r of previousReminders)
    await cancelReminderNotification(r.notification_id ?? undefined);
  await rescheduleEnabledReminders(LOCAL_BABY_ID);
  if (backup.prefs?.dashboardMetrics) {
    await saveDashboardMetrics(backup.prefs.dashboardMetrics as CareEventType[]);
  }
}

// Picker → confirm → import. Resolves true once data was replaced, false if
// the user backed out or the file was rejected (an alert says why).
export function pickAndImportBackup(): Promise<boolean> {
  return new Promise((resolve) => {
    (async () => {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets[0]) return resolve(false);

      let json: unknown;
      try {
        json = await new File(picked.assets[0].uri).json();
        validateBackup(json);
      } catch (err) {
        Alert.alert('Could not read backup', err instanceof Error ? err.message : String(err));
        return resolve(false);
      }

      Alert.alert(
        'Replace all data on this device?',
        "Everything currently in PreemieTrack on this device will be replaced by the backup's contents.",
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              try {
                await importBackup(json);
                resolve(true);
              } catch (err) {
                Alert.alert('Import failed', err instanceof Error ? err.message : String(err));
                resolve(false);
              }
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    })().catch((err) => {
      Alert.alert('Could not open backup', err instanceof Error ? err.message : String(err));
      resolve(false);
    });
  });
}

export async function eraseLocalData(onErased: () => void) {
  confirmDestructive(
    'Erase all data?',
    'This permanently removes everything PreemieTrack stored on this device. Export a backup first if you want to keep it.',
    async () => {
      const reminders = await listReminders(LOCAL_BABY_ID);
      for (const r of reminders) await cancelReminderNotification(r.notification_id ?? undefined);
      await resetLocalData();
      await clearOnboarded();
      onErased();
    },
  );
}

import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Linking, Platform, Share, Switch, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ThemePref, useTheme } from '@/features/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, space, type } from '@/lib/design-system/tokens';
import { confirmDestructive } from '@/lib/confirm';
import { ApiError } from '@/lib/api/client';
import { notifications, NotificationPermissionStatus } from '@/lib/notifications';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  cancelAccountDeletion,
  DeletionRequest,
  exportAccountData,
  listDeletionRequests,
  requestAccountDeletion,
} from '@/lib/api/privacy';
import { supabase } from '@/lib/supabase/client';
import { eraseLocalData, exportBackup, pickAndImportBackup } from '@/lib/offline/backup';
import { OFFLINE_ONLY, WEB_DEMO } from '@/lib/offlineOnly';
import { seedDemoData } from '@/lib/demo/seed';
import { feedingIntervalPresets, FeedingReminderSettings } from '@/features/feeding-reminder/interval';
import {
  loadFeedingReminderSettings,
  saveFeedingReminderSettings,
} from '@/features/feeding-reminder/service';
import appConfig from '../../app.json';

const compactInterval = (minutes: number) => `${minutes / 60}h`;

// After the local data is swapped out, re-run app/index.tsx's launch routing
// from a clean history — so finishing onboarding/baby-setup afterwards lands
// on Home rather than going back() into this stale Settings screen.
function restartAtLaunch() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/');
}

export default function Settings() {
  const { session } = useAuthSession();
  const { pref, setPref } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequest>();
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [profile, setProfile] = useState<BabyProfile>();
  const [permission, setPermission] = useState<NotificationPermissionStatus>('undetermined');
  const [updatingPermission, setUpdatingPermission] = useState(false);
  const [feedingReminder, setFeedingReminder] = useState<FeedingReminderSettings>({ enabled: false });

  const updateFeedingReminder = async (next: FeedingReminderSettings) => {
    setFeedingReminder(next);
    await saveFeedingReminderSettings(next);
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!OFFLINE_ONLY) {
        listDeletionRequests()
          .then((requests) => {
            if (active) setPendingDeletion(requests.find((r) => r.status === 'pending'));
          })
          .catch(() => undefined);
      }
      loadBabyProfile(LOCAL_BABY_ID).then((p) => {
        if (active) setProfile(p);
      });
      loadFeedingReminderSettings().then((s) => {
        if (active) setFeedingReminder(s);
      });
      notifications.getPermissionStatus().then((status) => {
        if (active) setPermission(status);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <FormScreen>
      <ScreenHeader title="Settings" back />

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          Appearance
        </Text>
        <SegmentedControl
          options={['Auto', 'Light', 'Dark']}
          value={pref[0].toUpperCase() + pref.slice(1)}
          onChange={(v) => setPref(v.toLowerCase() as ThemePref)}
        />
      </Card>

      {!OFFLINE_ONLY && (
        <Card style={{ gap: space.sm }}>
          <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
            Account
          </Text>
          <Text style={{ color: colors.muted, fontSize: type.caption }}>
            {session?.user.email ?? 'Not signed in'}
          </Text>
          <Button
            variant="secondary"
            onPress={() =>
              confirmDestructive(
                'Log out?',
                "You'll need to sign back in to access your baby's data on this device.",
                async () => {
                  await supabase.auth.signOut();
                  router.replace('/login');
                },
              )
            }
          >
            Log out
          </Button>
        </Card>
      )}

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          Baby profile
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          {profile
            ? `${profile.name || 'Baby'} · born ${new Date(profile.dateOfBirth).toLocaleDateString()}`
            : 'Add your baby’s details to personalize age tracking and charts.'}
        </Text>
        <Button variant="secondary" onPress={() => router.push('/baby-setup')}>
          {profile ? 'Edit profile' : 'Set up profile'}
        </Button>
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          Notifications
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: space.sm }}>
            <Text style={{ color: colors.text, fontSize: type.caption, fontFamily: type.fontBodyMedium }}>
              Reminder alerts
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              {permission === 'granted'
                ? 'Enabled — reminders will notify you on schedule.'
                : permission === 'denied'
                  ? 'Off in system settings — open Settings to turn back on.'
                  : permission === 'unavailable'
                    ? WEB_DEMO
                      ? 'Not available in the web demo — reminders still save and show in the app.'
                      : 'Not available in this app build — reminders will still save without an alert.'
                    : 'Not enabled yet.'}
            </Text>
          </View>
          <Switch
            value={permission === 'granted'}
            disabled={updatingPermission || permission === 'unavailable'}
            onValueChange={async (next) => {
              if (!next) {
                Alert.alert(
                  'Turn off notifications',
                  Platform.OS === 'ios'
                    ? 'Notification permissions are managed in the iOS Settings app.'
                    : 'Notification permissions are managed in your device settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                  ],
                );
                return;
              }
              if (permission === 'denied') {
                Linking.openSettings();
                return;
              }
              setUpdatingPermission(true);
              try {
                const granted = await notifications.requestPermission();
                setPermission(granted ? 'granted' : 'denied');
              } finally {
                setUpdatingPermission(false);
              }
            }}
          />
        </View>
        <Button variant="secondary" onPress={() => router.push('/more/reminders')}>
          Manage reminders
        </Button>
      </Card>

      <Card style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: space.sm }}>
            <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
              Feeding reminder
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              {feedingReminder.enabled
                ? 'Remind me this long after each feeding.'
                : 'Off — get a gentle nudge a set time after each feeding.'}
            </Text>
          </View>
          <Switch
            value={feedingReminder.enabled}
            onValueChange={(enabled) => updateFeedingReminder({ ...feedingReminder, enabled })}
          />
        </View>
        {feedingReminder.enabled && (
          <SegmentedControl
            options={feedingIntervalPresets.map(compactInterval)}
            value={feedingReminder.intervalMinutes ? compactInterval(feedingReminder.intervalMinutes) : ''}
            onChange={(label) =>
              updateFeedingReminder({
                ...feedingReminder,
                intervalMinutes: feedingIntervalPresets.find((m) => compactInterval(m) === label),
              })
            }
          />
        )}
      </Card>

      {OFFLINE_ONLY ? (
        <Card style={{ gap: space.sm }}>
          <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
            Your data
          </Text>
          <Text style={{ color: colors.muted, fontSize: type.caption }}>
            {WEB_DEMO
              ? 'This is a demo — everything is stored only in this browser, nothing is sent anywhere. Reset to bring back the sample baby, or erase everything to set up your own.'
              : 'Everything is stored only on this device. Export a backup file to keep a copy or move to another phone, then restore it there with Import backup.'}
          </Text>
          {WEB_DEMO && (
            <Button
              variant="secondary"
              onPress={() =>
                confirmDestructive(
                  'Reset demo data?',
                  'Everything you changed is replaced with the sample baby and her history.',
                  async () => {
                    await seedDemoData();
                    restartAtLaunch();
                  },
                  'Reset',
                )
              }
            >
              Reset demo data
            </Button>
          )}
          <Button
            disabled={exporting}
            onPress={async () => {
              setExporting(true);
              try {
                await exportBackup();
              } catch (err) {
                Alert.alert(
                  'Could not export your data',
                  err instanceof Error ? err.message : 'Something went wrong.',
                );
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'Preparing backup…' : 'Export backup'}
          </Button>
          <Button
            variant="secondary"
            onPress={async () => {
              if (await pickAndImportBackup()) restartAtLaunch();
            }}
          >
            Import backup
          </Button>
          <Button variant="destructive" onPress={() => eraseLocalData(restartAtLaunch)}>
            {WEB_DEMO ? 'Erase all data and start fresh' : 'Erase all data on this device'}
          </Button>
        </Card>
      ) : (
        <Card style={{ gap: space.sm }}>
          <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
            Your data
          </Text>
          <Text style={{ color: colors.muted, fontSize: type.caption }}>
            Download a copy of everything stored for this account — babies, care events,
            measurements, reminders, and sharing history.
          </Text>
          <Button
            disabled={exporting}
            onPress={async () => {
              setExporting(true);
              try {
                const data = await exportAccountData();
                await Share.share({
                  message: JSON.stringify(data, null, 2),
                  title: 'PreemieTrack account export',
                });
              } catch (err) {
                Alert.alert(
                  'Could not export your data',
                  err instanceof ApiError ? err.message : 'Something went wrong.',
                );
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'Preparing export…' : 'Export my data'}
          </Button>
        </Card>
      )}

      {!OFFLINE_ONLY && (
        <Card style={{ gap: space.sm }}>
          <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
            Account deletion
          </Text>
          {pendingDeletion ? (
            <>
              <Text style={{ color: colors.muted, fontSize: type.caption }}>
                A deletion request is pending review, requested{' '}
                {new Date(pendingDeletion.requestedAt).toLocaleDateString()}. Final data-retention
                timing is still being finalized — you can cancel any time before it's processed.
              </Text>
              <Button
                variant="destructive"
                onPress={async () => {
                  await cancelAccountDeletion(pendingDeletion.id);
                  setPendingDeletion(undefined);
                }}
              >
                Cancel deletion request
              </Button>
            </>
          ) : (
            <>
              <Text style={{ color: colors.muted, fontSize: type.caption }}>
                Request permanent deletion of this account and its data. A team member reviews
                every request before anything is removed.
              </Text>
              <Button
                variant="destructive"
                disabled={requestingDeletion}
                onPress={() =>
                  confirmDestructive(
                    'Request account deletion?',
                    "This starts the deletion review process. You can cancel it any time before it's processed.",
                    async () => {
                      setRequestingDeletion(true);
                      try {
                        const request = await requestAccountDeletion();
                        setPendingDeletion(request);
                      } catch (err) {
                        Alert.alert(
                          'Could not submit request',
                          err instanceof ApiError ? err.message : 'Something went wrong.',
                        );
                      } finally {
                        setRequestingDeletion(false);
                      }
                    },
                  )
                }
              >
                Request account deletion
              </Button>
            </>
          )}
        </Card>
      )}

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
          About
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          {appConfig.expo.name} · version {appConfig.expo.version}
        </Text>
      </Card>
    </FormScreen>
  );
}

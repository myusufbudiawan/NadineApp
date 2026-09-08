import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Linking, Platform, Share, Switch, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
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
import appConfig from '../../app.json';

export default function Settings() {
  const { session } = useAuthSession();
  const [exporting, setExporting] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequest>();
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [profile, setProfile] = useState<BabyProfile>();
  const [permission, setPermission] = useState<NotificationPermissionStatus>('undetermined');
  const [updatingPermission, setUpdatingPermission] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listDeletionRequests()
        .then((requests) => {
          if (active) setPendingDeletion(requests.find((r) => r.status === 'pending'));
        })
        .catch(() => undefined);
      loadBabyProfile(LOCAL_BABY_ID).then((p) => {
        if (active) setProfile(p);
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
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
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

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
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
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          Notifications
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: space.sm }}>
            <Text style={{ color: colors.text, fontSize: type.caption, fontWeight: '600' }}>
              Reminder alerts
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              {permission === 'granted'
                ? 'Enabled — reminders will notify you on schedule.'
                : permission === 'denied'
                  ? 'Off in system settings — open Settings to turn back on.'
                  : permission === 'unavailable'
                    ? 'Not available in this app build — reminders will still save without an alert.'
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
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
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

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
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

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          About
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          {appConfig.expo.name} · version {appConfig.expo.version}
        </Text>
      </Card>
    </FormScreen>
  );
}

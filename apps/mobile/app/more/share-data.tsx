import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { confirmDestructive } from '@/lib/confirm';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { ApiError } from '@/lib/api/client';
import { inviteCaregiver, listShares, revokeShare, ShareGrant, SharePermission } from '@/lib/api/sharing';

const permissionOptions: SharePermission[] = ['read', 'write'];
const permissionLabels: Record<SharePermission, string> = { read: 'Can view', write: 'Can edit' };

export default function ShareData() {
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('read');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const list = await listShares(LOCAL_BABY_ID);
      setGrants(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load sharing settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().then(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, [load]),
  );

  const activeGrants = grants.filter((g) => !g.revokedAt);
  const revokedGrants = grants.filter((g) => g.revokedAt);

  return (
    <FormScreen>
      <ScreenHeader title="Share Data" back />
      <Text style={{ color: colors.muted, fontSize: type.caption }}>
        Invite another caregiver to view or help log this baby&apos;s care. Revoking access takes
        effect immediately.
      </Text>

      <Card style={{ gap: space.md }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          Invite a caregiver
        </Text>
        <TextInput
          accessibilityLabel="Caregiver email"
          placeholder="caregiver@example.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{
            minHeight: 50,
            paddingHorizontal: space.md,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.sm,
            fontSize: type.body,
            color: colors.text,
          }}
        />
        <SegmentedControl
          options={permissionOptions.map((p) => permissionLabels[p])}
          value={permissionLabels[permission]}
          onChange={(label) =>
            setPermission(permissionOptions.find((p) => permissionLabels[p] === label)!)
          }
        />
        <Button
          disabled={inviting || !email.trim()}
          onPress={async () => {
            setInviting(true);
            try {
              await inviteCaregiver(LOCAL_BABY_ID, { recipientEmail: email.trim(), permission });
              setEmail('');
              await load();
            } catch (err) {
              Alert.alert(
                'Could not send invite',
                err instanceof ApiError ? err.message : 'Something went wrong.',
              );
            } finally {
              setInviting(false);
            }
          }}
        >
          {inviting ? 'Sending…' : 'Send invite'}
        </Button>
      </Card>

      {loading && <Text style={{ color: colors.muted }}>Loading…</Text>}
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}

      {!loading && activeGrants.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            No caregivers have access yet.
          </Text>
        </Card>
      )}

      {activeGrants.map((grant) => (
        <View key={grant.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <ListRow
              icon="person-outline"
              tone="violet"
              title={grant.granteeEmail}
              subtitle={permissionLabels[grant.permission]}
            />
          </View>
          <Button
            variant="destructive"
            onPress={() =>
              confirmDestructive(
                'Revoke access?',
                `${grant.granteeEmail} will immediately lose access to this baby's data.`,
                async () => {
                  try {
                    await revokeShare(LOCAL_BABY_ID, grant.id);
                    await load();
                  } catch (err) {
                    Alert.alert(
                      'Could not revoke access',
                      err instanceof ApiError ? err.message : 'Something went wrong.',
                    );
                  }
                },
              )
            }
          >
            Revoke
          </Button>
        </View>
      ))}

      {revokedGrants.length > 0 && (
        <>
          <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.muted }}>
            Revoked
          </Text>
          {revokedGrants.map((grant) => (
            <ListRow
              key={grant.id}
              icon="person-outline"
              tone="gray"
              title={grant.granteeEmail}
              subtitle={`Access revoked · ${new Date(grant.revokedAt!).toLocaleDateString()}`}
            />
          ))}
        </>
      )}
    </FormScreen>
  );
}

import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Switch, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { IconChip } from '@/components/ui/IconChip';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CareEventType } from '@/features/care-events/types';
import { getDashboardMetricView } from '@/features/dashboard/metricConfig';
import {
  DASHBOARD_TILE_COUNT,
  dashboardMetricTypes,
  loadDashboardMetrics,
  saveDashboardMetrics,
} from '@/features/dashboard/preferences';
import { colors, space, type } from '@/lib/design-system/tokens';

export default function CustomizeDashboard() {
  const [selected, setSelected] = useState<CareEventType[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDashboardMetrics().then((metrics) => {
        if (active) {
          setSelected(metrics);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const toggle = (metricType: CareEventType) => {
    setSelected((current) => {
      const isSelected = current.includes(metricType);
      if (isSelected) {
        return current.filter((t) => t !== metricType);
      }
      if (current.length >= DASHBOARD_TILE_COUNT) {
        Alert.alert(
          'Only 4 boxes',
          `Your dashboard shows ${DASHBOARD_TILE_COUNT} tracking boxes. Turn one off first to swap it for another.`,
        );
        return current;
      }
      return [...current, metricType];
    });
  };

  const save = async () => {
    if (selected.length !== DASHBOARD_TILE_COUNT) {
      Alert.alert('Choose 4', `Select exactly ${DASHBOARD_TILE_COUNT} tracking boxes to show.`);
      return;
    }
    await saveDashboardMetrics(selected);
    router.back();
  };

  if (!loaded) {
    return (
      <FormScreen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <ScreenHeader title="Customize Dashboard" back />
      <Text style={{ color: colors.muted, fontSize: type.body }}>
        Choose which {DASHBOARD_TILE_COUNT} tracking boxes show on your Home screen. Selected:{' '}
        {selected.length}/{DASHBOARD_TILE_COUNT}
      </Text>
      <Card style={{ gap: space.sm }}>
        {dashboardMetricTypes.map((metricType) => {
          const metric = getDashboardMetricView(metricType, undefined);
          const isSelected = selected.includes(metricType);
          return (
            <View
              key={metricType}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingVertical: space.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <IconChip icon={metric.icon} tone={metric.tone} label="" />
              <Text
                style={{
                  flex: 1,
                  fontSize: type.body,
                  fontFamily: type.fontBodyMedium,
                  color: colors.text,
                }}
              >
                {metric.title}
              </Text>
              <Switch
                value={isSelected}
                onValueChange={() => toggle(metricType)}
                accessibilityLabel={`Show ${metric.title} on dashboard`}
              />
            </View>
          );
        })}
      </Card>
      <Text
        accessibilityRole="button"
        onPress={save}
        style={{
          textAlign: 'center',
          fontSize: type.label,
          fontFamily: type.fontBodyMedium,
          color: colors.white,
          backgroundColor: selected.length === DASHBOARD_TILE_COUNT ? colors.accentStrong : colors.faint,
          paddingVertical: space.md,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        Save
      </Text>
    </FormScreen>
  );
}

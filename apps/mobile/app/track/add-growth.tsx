import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { EntryForm } from '@/components/forms/EntryForm';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { saveGrowthMeasurement } from '@/features/growth/storage';
import { growthMetricLabels, GrowthMetric, growthMetricUnits } from '@/features/growth/types';

// Length and head circumference have no other capture point in the prototype
// (Section 2.2) — this screen fills that gap using the same EntryForm
// skeleton every other Add-X screen uses (Constitution 0.A #2). Weight is
// intentionally not offered here: it is already captured via Track > Add
// Weight and the Growth screen reads that history directly.
export default function AddGrowth() {
  const { metric: initialMetric } = useLocalSearchParams<{ metric?: string }>();
  const startingMetric: GrowthMetric =
    initialMetric === 'headCircumference' ? 'headCircumference' : 'length';

  return (
    <FormScreen>
      <ScreenHeader title="Add Measurement" back />
      <EntryForm
        fields={[
          {
            kind: 'segmented',
            key: 'metric',
            label: 'Measurement',
            options: [growthMetricLabels.length, growthMetricLabels.headCircumference],
            initial: growthMetricLabels[startingMetric],
          },
          {
            kind: 'stepper',
            key: 'value',
            label: 'Value',
            unit: 'cm',
            initial: 40,
            step: 0.1,
            rangeMin: 0,
            rangeMax: 100,
          },
          {
            kind: 'time',
            key: 'time',
            label: 'Time',
            initial: new Date(),
          },
        ]}
        showNotes={false}
        onSave={async (values) => {
          try {
            const metric: GrowthMetric =
              values.metric === growthMetricLabels.headCircumference
                ? 'headCircumference'
                : 'length';
            await saveGrowthMeasurement({
              babyId: LOCAL_BABY_ID,
              metric,
              value: values.value as number,
              unit: growthMetricUnits[metric],
              measuredAt: values.time as Date,
            });
            router.back();
          } catch (error) {
            Alert.alert('Could not save measurement', (error as Error).message);
          }
        }}
      />
    </FormScreen>
  );
}

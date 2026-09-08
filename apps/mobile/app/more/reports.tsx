import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePicker } from '@/components/forms/DatePicker';
import { colors, space, type } from '@/lib/design-system/tokens';
import { generateReport, generateReportCsv, ReportResult } from '@/lib/api/reports';
import { requireServerBabyId } from '@/lib/offline/serverBaby';

function formatAge(age: { weeks: number; days: number }) {
  return `${age.weeks}w ${age.days}d`;
}

export default function Reports() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 86_400_000));
  const [to, setTo] = useState(() => new Date());
  const [report, setReport] = useState<ReportResult>();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>();

  const generate = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const babyId = await requireServerBabyId();
      const result = await generateReport(babyId, { from, to });
      setReport(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not generate the report. Check your connection and try again.',
      );
      setReport(undefined);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const babyId = await requireServerBabyId();
      const csv = await generateReportCsv(babyId, { from, to });
      // A one-time export — sharing the resulting file never grants ongoing
      // account access (Section 15), unlike Share Data's caregiver invites.
      await Share.share({ message: csv, title: 'PreemieTrack report (CSV)' });
    } catch (err) {
      Alert.alert(
        'Could not export report',
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <FormScreen>
      <ScreenHeader title="Reports" back />
      <Text style={{ color: colors.muted, fontSize: type.caption }}>
        Generate a summary of care events and measurements for a date range — useful to share
        with a clinician or care team.
      </Text>

      <Card style={{ gap: space.md }}>
        <DatePicker label="From" value={from} onChange={setFrom} />
        <DatePicker label="To" value={to} onChange={setTo} />
        <Button disabled={loading} onPress={generate}>
          {loading ? 'Generating…' : 'Generate report'}
        </Button>
      </Card>

      {error && <Text style={{ color: colors.danger }}>{error}</Text>}

      {report && (
        <>
          <Card style={{ gap: space.sm }}>
            <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
              {report.babyProfile.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              Actual age {formatAge(report.ageContext.actualAge)} · Corrected age{' '}
              {formatAge(report.ageContext.correctedAge)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption }}>
              {new Date(report.dateRange.from).toLocaleDateString()} –{' '}
              {new Date(report.dateRange.to).toLocaleDateString()}
            </Text>
          </Card>

          <Card style={{ gap: space.sm }}>
            <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
              Care events
            </Text>
            {report.careEventSummary.length === 0 && (
              <Text style={{ color: colors.muted }}>No care events in this range.</Text>
            )}
            {report.careEventSummary.map((group) => (
              <View
                key={group.type}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text style={{ color: colors.text, textTransform: 'capitalize' }}>
                  {group.type}
                </Text>
                <Text style={{ color: colors.muted }}>{group.count}</Text>
              </View>
            ))}
          </Card>

          <Card style={{ gap: space.sm }}>
            <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
              Measurements
            </Text>
            {report.measurements.length === 0 && (
              <Text style={{ color: colors.muted }}>No growth measurements in this range.</Text>
            )}
            {report.measurements.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{m.metric}</Text>
                <Text style={{ color: colors.muted }}>
                  {m.value} {m.unit} · {new Date(m.measuredAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </Card>

          <Button disabled={exporting} onPress={exportCsv}>
            {exporting ? 'Exporting…' : 'Export as CSV'}
          </Button>
        </>
      )}
    </FormScreen>
  );
}

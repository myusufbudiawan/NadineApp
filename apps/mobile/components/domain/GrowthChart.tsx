import { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
import { formatMeasurement } from '@/lib/format';

export type GrowthChartPoint = { ageWeeks: number; value: number };
export type GrowthChartBand = { low: number; mid: number; high: number };

const Y_AXIS_GUTTER = 34;
const BAND_STRIP_COUNT = 48;
const BAND_CURVE_SAMPLES = 24;
const MIN_Y_PAD = 0.5; // always leave at least this much headroom above/below the plotted range
const BAND_CURVE_KEYS = [
  { key: 'low', label: '15th' },
  { key: 'mid', label: '50th' },
  { key: 'high', label: '85th' },
] as const;

function formatWeeksForLabel(weeks: number) {
  const abs = Math.abs(weeks).toFixed(1);
  return weeks < 0 ? `${abs} weeks before the due date` : `${abs} corrected weeks`;
}

// Rounds a rough step size up to a "nice" 1/2/5-times-a-power-of-ten value —
// the standard trick behind evenly-spaced, human-readable axis ticks (e.g.
// 0.5 kg or 2-week increments rather than 0.4173 kg).
function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exponent = Math.floor(Math.log10(rough));
  const fraction = rough / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

const MAX_FORCED_TICKS = 14; // guard rail: fall back to an auto step rather than drawing an unreadable wall of gridlines

function computeTicks(min: number, max: number, targetCount: number, forcedStep?: number): number[] {
  if (min === max && !forcedStep) return [min];
  let step = forcedStep ?? niceStep((max - min) / Math.max(1, targetCount - 1));
  if (forcedStep && (max - min) / forcedStep > MAX_FORCED_TICKS) {
    step = niceStep((max - min) / Math.max(1, targetCount - 1));
  }
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

// No charting library is installed (Constitution 0.A #1 — avoid introducing a
// new dependency/paradigm mid-build), so the line, axes, and reference band
// are all drawn with plain absolutely-positioned Views/Text: a rotated
// hairline segment between each consecutive pair of points, tick labels
// placed by the same coordinate math, the shaded band approximated as many
// thin adjacent vertical strips, and its 15th/50th/85th boundaries drawn as
// dashed polylines (there's no path-fill or stroke-dasharray primitive
// without SVG). Handles zero, one, sparse, and dense datasets by deriving the
// axis domain from the data — and from the reference band, so a band wider
// than the plotted points is never clipped — snapped to nice round numbers,
// with at least MIN_Y_PAD of headroom so points never sit flush against the
// plot edges. Domain includes negative corrected ages for babies not yet at
// their due date (Section 8.2), marked with a "Due date" line at zero.
export function GrowthChart({
  points,
  seriesLabel,
  unit,
  emptyMessage,
  referenceLabel,
  referenceBandAt,
  yStep,
  startAgeWeeks,
}: {
  points: GrowthChartPoint[];
  seriesLabel: string;
  unit: string;
  emptyMessage: string;
  referenceLabel?: string;
  referenceBandAt?: (ageWeeks: number) => GrowthChartBand | undefined;
  /** Fixed y-axis tick spacing (e.g. 0.5 for kg) instead of the auto-picked "nice" step. */
  yStep?: number;
  /** Earliest corrected age the x-axis should reach even without a reading there (e.g. birth). */
  startAgeWeeks?: number;
}) {
  const [plotWidth, setPlotWidth] = useState(0);
  const height = 180;
  const onLayout = (event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width);

  if (points.length === 0) {
    return (
      <View
        accessibilityLabel={emptyMessage}
        style={{
          height: height + 65,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.muted, fontSize: type.body }}>{emptyMessage}</Text>
      </View>
    );
  }

  const xValues = points.map((p) => p.ageWeeks);
  const yValues = points.map((p) => p.value);
  const rawXMin = Math.min(0, startAgeWeeks ?? 0, ...xValues);
  const rawXMax = Math.max(10, ...xValues);

  // Sample the band across the x-range up front so its extent can widen the
  // y-domain when needed (e.g. a preterm baby's weight sitting well below
  // where a term reference band falls just past the due date).
  const bandSampleValues: number[] = [];
  if (referenceBandAt) {
    for (let i = 0; i <= BAND_STRIP_COUNT; i++) {
      const ageWeeks = rawXMin + (i / BAND_STRIP_COUNT) * (rawXMax - rawXMin);
      const band = referenceBandAt(ageWeeks);
      if (band) bandSampleValues.push(band.low, band.high);
    }
  }

  const dataMin = Math.min(...yValues, ...bandSampleValues);
  const dataMax = Math.max(...yValues, ...bandSampleValues);
  const relativePad = dataMax === dataMin ? dataMax * 0.1 : (dataMax - dataMin) * 0.2;
  const yPad = Math.max(MIN_Y_PAD, relativePad);
  const rawYMin = Math.max(0, dataMin - yPad);
  const rawYMax = dataMax + yPad;

  // Ticks are computed first, then the axis domain snaps to their min/max so
  // gridlines and labels land exactly on the drawn axis ends.
  const xTicks = computeTicks(rawXMin, rawXMax, 6);
  const yTicks = computeTicks(rawYMin, rawYMax, 5, yStep);
  const xMin = xTicks[0];
  const xMax = xTicks[xTicks.length - 1];
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const yDecimals = yTicks.some((t) => !Number.isInteger(t)) ? 1 : 0;

  const toX = (v: number) => ((v - xMin) / (xMax - xMin || 1)) * (plotWidth || 1);
  const toY = (v: number) => height - ((v - yMin) / (yMax - yMin || 1)) * height;
  const showDueDateMarker = xMin < 0 && xMax > 0;

  const bandCurves = referenceBandAt
    ? BAND_CURVE_KEYS.map(({ key, label }) => {
        const curveSamples: { x: number; y: number }[] = [];
        for (let i = 0; i <= BAND_CURVE_SAMPLES; i++) {
          const ageWeeks = xMin + (i / BAND_CURVE_SAMPLES) * (xMax - xMin);
          const band = referenceBandAt(ageWeeks);
          if (band) curveSamples.push({ x: toX(ageWeeks), y: toY(band[key]) });
        }
        return { label, samples: curveSamples };
      })
    : [];

  const first = points[0];
  const last = points[points.length - 1];
  const rangeDescription =
    points.length === 1
      ? `one reading of ${formatMeasurement(first.value)} ${unit} at ${formatWeeksForLabel(first.ageWeeks)}`
      : `${points.length} readings from ${formatMeasurement(first.value)} to ${formatMeasurement(last.value)} ${unit}, spanning ${formatWeeksForLabel(first.ageWeeks)} to ${formatWeeksForLabel(last.ageWeeks)}`;
  const accessibilityLabel = referenceLabel
    ? `${seriesLabel} chart: ${rangeDescription}. ${referenceLabel}.`
    : `${seriesLabel} chart: ${rangeDescription}.`;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: Y_AXIS_GUTTER, height }}>
          <Text style={{ fontSize: 10, color: colors.muted }}>{unit}</Text>
          {yTicks
            .slice()
            .reverse()
            .map((tick) => (
              <Text
                key={tick}
                style={{
                  position: 'absolute',
                  top: toY(tick) - 7,
                  right: 4,
                  fontSize: 10,
                  color: colors.muted,
                }}
              >
                {tick.toFixed(yDecimals)}
              </Text>
            ))}
        </View>
        <View
          accessibilityLabel={accessibilityLabel}
          onLayout={onLayout}
          style={{
            flex: 1,
            height,
            borderLeftWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          {plotWidth > 0 &&
            referenceBandAt &&
            Array.from({ length: BAND_STRIP_COUNT }, (_, i) => {
              const stripWidth = plotWidth / BAND_STRIP_COUNT;
              const left = i * stripWidth;
              const ageWeeks = xMin + ((left + stripWidth / 2) / plotWidth) * (xMax - xMin);
              const band = referenceBandAt(ageWeeks);
              if (!band) return null;
              const top = toY(band.high);
              const bottom = toY(band.low);
              return (
                <View
                  key={`band-${i}`}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: stripWidth + 0.5,
                    height: Math.max(1, bottom - top),
                    backgroundColor: colors.pinkSoft,
                  }}
                />
              );
            })}
          {plotWidth > 0 &&
            bandCurves.flatMap((curve, curveIndex) =>
              curve.samples.slice(1).map((point, index) => {
                const prev = curve.samples[index];
                const dx = point.x - prev.x;
                const dy = point.y - prev.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View
                    key={`band-curve-${curveIndex}-${index}`}
                    style={{
                      position: 'absolute',
                      left: prev.x,
                      top: prev.y,
                      width: length,
                      borderTopWidth: 1,
                      borderStyle: 'dashed',
                      borderTopColor: colors.pink,
                      opacity: curveIndex === 1 ? 0.85 : 0.6,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                    }}
                  />
                );
              }),
            )}
          {plotWidth > 0 &&
            bandCurves.map((curve, curveIndex) => {
              const lastPoint = curve.samples[curve.samples.length - 1];
              if (!lastPoint) return null;
              return (
                <Text
                  key={`band-label-${curveIndex}`}
                  style={{
                    position: 'absolute',
                    right: 2,
                    top: Math.min(Math.max(lastPoint.y - 7, 0), height - 12),
                    fontSize: 8,
                    color: colors.pink,
                  }}
                >
                  {curve.label}
                </Text>
              );
            })}
          {plotWidth > 0 &&
            yTicks.map((tick) => (
              <View
                key={tick}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: toY(tick),
                  height: 1,
                  backgroundColor: colors.line,
                }}
              />
            ))}
          {plotWidth > 0 && showDueDateMarker && (
            <View
              style={{
                position: 'absolute',
                left: toX(0),
                top: 0,
                bottom: 0,
                width: 1,
                borderLeftWidth: 1,
                borderLeftColor: colors.pink,
                borderStyle: 'dashed',
              }}
            />
          )}
          {plotWidth > 0 && showDueDateMarker && (
            <Text
              style={{
                position: 'absolute',
                left: Math.min(Math.max(toX(0) + 4, 0), plotWidth - 60),
                top: 2,
                fontSize: 9,
                fontFamily: type.fontHeading,
                letterSpacing: 0.6,
                color: colors.pink,
              }}
            >
              DUE DATE
            </Text>
          )}
          {plotWidth > 0 &&
            points.slice(1).map((point, index) => {
              const prev = points[index];
              const x1 = toX(prev.ageWeeks);
              const y1 = toY(prev.value);
              const x2 = toX(point.ageWeeks);
              const y2 = toY(point.value);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View
                  key={`${prev.ageWeeks}-${point.ageWeeks}-${index}`}
                  style={{
                    position: 'absolute',
                    left: x1,
                    top: y1,
                    width: length,
                    height: 2,
                    backgroundColor: colors.pink,
                    borderRadius: 1,
                    transform: [{ translateY: -1 }, { rotate: `${angle}deg` }],
                    transformOrigin: 'left center',
                  }}
                />
              );
            })}
          {plotWidth > 0 && (
            <View
              style={{
                position: 'absolute',
                left: toX(last.ageWeeks) - 3.5,
                top: toY(last.value) - 3.5,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: colors.pink,
              }}
            />
          )}
        </View>
      </View>
      {plotWidth > 0 && (
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <View style={{ width: Y_AXIS_GUTTER }} />
          <View style={{ flex: 1, height: 14 }}>
            {xTicks.map((tick) => (
              <Text
                key={tick}
                style={{
                  position: 'absolute',
                  left: Math.min(Math.max(toX(tick) - 10, 0), plotWidth - 20),
                  fontSize: 10,
                  color: colors.muted,
                }}
              >
                {tick}
              </Text>
            ))}
          </View>
        </View>
      )}
      <Text
        style={{
          alignSelf: 'center',
          marginTop: 8,
          fontSize: type.caption,
          color: colors.muted,
        }}
      >
        Corrected age (weeks){showDueDateMarker ? ' · 0 = due date' : ''}
      </Text>
      {referenceLabel && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 10,
            lineHeight: 15,
            color: colors.muted,
          }}
        >
          {referenceLabel}
        </Text>
      )}
    </View>
  );
}

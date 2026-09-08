export type GrowthReferenceStandard = {
  id: 'preterm' | 'term';
  name: string;
  disclaimer: string;
};

/**
 * NEEDS-CLINICAL-REVIEW: Open Product Decision #1 (which named/versioned
 * growth standard, for which population) is unresolved — this labels which
 * standard *should* apply, it doesn't itself constitute clinical sign-off.
 *
 * Before the baby's due date (corrected age negative), no shaded reference
 * band is drawn at all: the preterm-appropriate chart (e.g. Fenton) has
 * proprietary underlying data not available to embed here, and no
 * substitute open-license preterm dataset was sourced in time. From the due
 * date onward, the band uses WHO Child Growth Standards (2006), boys,
 * 15th–85th percentile — see `reference-data.ts` for the actual transcribed
 * values and its own caveats (boys-only unisex stand-in, monthly anchors).
 */
export function growthReferenceFor(correctedAgeTotalDays: number): GrowthReferenceStandard {
  if (correctedAgeTotalDays < 0) {
    return {
      id: 'preterm',
      name: 'Preterm growth reference (e.g. Fenton preterm growth chart)',
      disclaimer: 'No preterm reference band available yet — pending a licensed dataset',
    };
  }
  return {
    id: 'term',
    name: 'WHO Child Growth Standards (2006)',
    disclaimer: 'WHO Child Growth Standards, 15th–85th percentile — pending clinical review',
  };
}

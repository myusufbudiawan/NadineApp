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
 * Before the due date (corrected age negative) the band is an approximation
 * of the Fenton preterm growth chart (its exact data is proprietary); from
 * the due date onward it's WHO Child Growth Standards (2006), eased in over
 * the first 10 corrected weeks — see `growthReferenceBandAt` in
 * `reference-data.ts`.
 */
export function growthReferenceFor(correctedAgeTotalDays: number): GrowthReferenceStandard {
  if (correctedAgeTotalDays < 0) {
    return {
      id: 'preterm',
      name: 'Preterm growth reference (approximation of the Fenton preterm growth chart)',
      disclaimer:
        'Shaded: 15th–85th percentile. Preterm reference (approx. Fenton) until the due date, then WHO Child Growth Standards — pending clinical review',
    };
  }
  return {
    id: 'term',
    name: 'WHO Child Growth Standards (2006)',
    disclaimer:
      'Shaded: 15th–85th percentile. WHO Child Growth Standards, eased in from the preterm reference over the first 10 weeks — pending clinical review',
  };
}

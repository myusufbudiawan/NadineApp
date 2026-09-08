import { ContentService } from './service.js';

// Placeholder copy only — every item ships as 'needs-clinical-review' so
// ContentService.list() (Section 15 guardrail) never surfaces it to a
// caregiver until a clinical reviewer promotes it to 'approved' via the
// authoring endpoint. This exists so the pipeline (author → review → list)
// is exercised end-to-end even though no content is enabled by default.
export async function seedPlaceholderTips(service: ContentService) {
  const placeholders = [
    {
      title: 'Kangaroo Care Basics',
      body: 'Placeholder — pending clinical review.',
      category: 'kangaroo-care' as const,
      source: 'internal-placeholder',
      reviewStatus: 'needs-clinical-review' as const,
    },
    {
      title: 'Paced Bottle Feeding',
      body: 'Placeholder — pending clinical review.',
      category: 'feeding' as const,
      source: 'internal-placeholder',
      reviewStatus: 'needs-clinical-review' as const,
    },
    {
      title: 'Understanding Growth Trends',
      body: 'Placeholder — pending clinical review.',
      category: 'growth' as const,
      source: 'internal-placeholder',
      reviewStatus: 'needs-clinical-review' as const,
    },
    {
      title: 'Safe Sleep for Preemies',
      body: 'Placeholder — pending clinical review.',
      category: 'sleep' as const,
      source: 'internal-placeholder',
      reviewStatus: 'needs-clinical-review' as const,
    },
    {
      title: 'Coping as a NICU/Preemie Parent',
      body: 'Placeholder — pending clinical review.',
      category: 'emotional-support' as const,
      source: 'internal-placeholder',
      reviewStatus: 'needs-clinical-review' as const,
    },
  ];
  for (const tip of placeholders) {
    await service.create(tip);
  }
}

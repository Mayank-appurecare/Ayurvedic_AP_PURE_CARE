import { reviews as mockReviews } from '../../data/reviews';
import { aReview } from '../../test-utils/fixtures';

describe('ReviewRepository', () => {
  // Reviews live in a module-level array seeded once from src/data/reviews.
  // Resetting the module registry before every test re-runs that seeding
  // fresh, so addReview/markHelpful in one test never leak into another.
  let ReviewRepository: typeof import('../ReviewRepository').ReviewRepository;

  beforeEach(() => {
    jest.resetModules();
    ReviewRepository = require('../ReviewRepository').ReviewRepository;
  });

  describe('getForProduct', () => {
    it("returns only that product's reviews, sorted newest date first", async () => {
      const result = await ReviewRepository.getForProduct('p-ashwagandha-capsules');
      // Seed dates for this product: r1 08-12, r2 07-30, r3 07-18, r4 06-22.
      expect(result.map((r) => r.id)).toEqual(['r1', 'r2', 'r3', 'r4']);
      expect(result.every((r) => r.productId === 'p-ashwagandha-capsules')).toBe(true);
    });
  });

  describe('getRecent', () => {
    it('returns only rating >= 4 reviews, newest first, capped at the limit', async () => {
      const result = await ReviewRepository.getRecent(5);
      // 12 of the 13 seed reviews qualify (rating >= 4); r4 (rating 3) is
      // excluded. Sorted newest-first, the top 5 by date are:
      // r8 08-20, r12 08-15, r1 08-12, r10 08-05, r5 08-02.
      expect(result.map((r) => r.id)).toEqual(['r8', 'r12', 'r1', 'r10', 'r5']);
      expect(result.every((r) => r.rating >= 4)).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('hand-computes total/average/distribution for a product with a few reviews', async () => {
      // p-triphala-churna has exactly two seed reviews: r10 (rating 5), r11 (rating 4).
      const summary = await ReviewRepository.getSummary('p-triphala-churna');
      expect(summary).toEqual({
        total: 2,
        average: 4.5,
        distribution: [
          { star: 5, count: 1 },
          { star: 4, count: 1 },
          { star: 3, count: 0 },
          { star: 2, count: 0 },
          { star: 1, count: 0 },
        ],
      });
    });

    it('resolves all-zero for a product with no reviews at all', async () => {
      const summary = await ReviewRepository.getSummary('no-such-product');
      expect(summary).toEqual({
        total: 0,
        average: 0,
        distribution: [
          { star: 5, count: 0 },
          { star: 4, count: 0 },
          { star: 3, count: 0 },
          { star: 2, count: 0 },
          { star: 1, count: 0 },
        ],
      });
    });
  });

  describe('addReview', () => {
    it("prepends a new review with a generated id, today's date and helpfulCount 0", async () => {
      const { id, date, helpfulCount, ...input } = aReview({ productId: 'test-product-xyz' });
      const created = await ReviewRepository.addReview(input);
      const today = new Date().toISOString().slice(0, 10);

      expect(created).toEqual({
        ...input,
        id: expect.any(String),
        date: today,
        helpfulCount: 0,
      });

      const forProduct = await ReviewRepository.getForProduct('test-product-xyz');
      expect(forProduct).toEqual([created]);
    });
  });

  describe('markHelpful', () => {
    it('increments that review helpfulCount by exactly 1', async () => {
      const before = mockReviews.find((r) => r.id === 'r1')!;
      const updated = await ReviewRepository.markHelpful('r1');
      expect(updated).toEqual({ ...before, helpfulCount: before.helpfulCount + 1 });
    });

    it('resolves undefined for an unknown id', async () => {
      await expect(ReviewRepository.markHelpful('no-such-id')).resolves.toBeUndefined();
    });
  });
});

import { reviews as mockReviews } from '../data/reviews';
import { Review } from '../types';

const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((r) => setTimeout(() => r(value), ms));

let reviewsStore: Review[] = [...mockReviews];

export const ReviewRepository = {
  async getForProduct(productId: string): Promise<Review[]> {
    return delay(
      reviewsStore
        .filter((r) => r.productId === productId)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    );
  },

  /**
   * Highly-rated recent reviews, not tied to any particular product.
   *
   * The Home testimonials strip uses this. It previously derived its reviews
   * from the best-seller list, which no longer exists now that Home shows the
   * API product list — and the API carries no review data at all, so these stay
   * local demo content.
   */
  async getRecent(limit = 3): Promise<Review[]> {
    return delay(
      reviewsStore
        .filter((r) => r.rating >= 4)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, limit)
    );
  },

  async getSummary(productId: string) {
    const list = reviewsStore.filter((r) => r.productId === productId);
    const total = list.length;
    const average = total ? list.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: list.filter((r) => r.rating === star).length,
    }));
    return delay({ total, average, distribution });
  },

  async addReview(review: Omit<Review, 'id' | 'helpfulCount' | 'date'>): Promise<Review> {
    const newReview: Review = {
      ...review,
      id: `r-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      helpfulCount: 0,
    };
    reviewsStore = [newReview, ...reviewsStore];
    return delay(newReview, 400);
  },

  async markHelpful(reviewId: string): Promise<Review | undefined> {
    reviewsStore = reviewsStore.map((r) =>
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    );
    return delay(reviewsStore.find((r) => r.id === reviewId));
  },
};

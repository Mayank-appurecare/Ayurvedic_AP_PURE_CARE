import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { ReviewsScreen } from '../ReviewsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { ReviewRepository } from '../../../repositories/ReviewRepository';
import { aReview } from '../../../test-utils/fixtures';
import { Review } from '../../../types';

jest.mock('../../../repositories/ReviewRepository', () => ({
  ReviewRepository: {
    getForProduct: jest.fn(),
    getSummary: jest.fn(),
    markHelpful: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { productId: 'p1' } }),
}));

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { star: number; count: number }[];
}

function makeSummary(overrides: Partial<ReviewSummary> = {}): ReviewSummary {
  return {
    total: 3,
    average: 4.3,
    distribution: [
      { star: 5, count: 2 },
      { star: 4, count: 0 },
      { star: 3, count: 1 },
      { star: 2, count: 0 },
      { star: 1, count: 0 },
    ],
    ...overrides,
  };
}

const REVIEW_5A = aReview({
  id: 'r1',
  productId: 'p1',
  rating: 5,
  text: 'Fantastic, will buy again.',
  helpfulCount: 2,
});
const REVIEW_5B = aReview({
  id: 'r2',
  productId: 'p1',
  rating: 5,
  text: 'Works well for me too.',
  helpfulCount: 5,
});
const REVIEW_3 = aReview({
  id: 'r3',
  productId: 'p1',
  rating: 3,
  text: 'Decent, nothing special.',
  helpfulCount: 0,
});

function mockReviewRepo({
  reviews = [] as Review[],
  summary = makeSummary(),
}: { reviews?: Review[]; summary?: ReviewSummary } = {}) {
  (ReviewRepository.getForProduct as jest.Mock).mockResolvedValue(reviews);
  (ReviewRepository.getSummary as jest.Mock).mockResolvedValue(summary);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReviewRepo();
});

describe('ReviewsScreen', () => {
  it('shows the loading state while reviews are loading', async () => {
    (ReviewRepository.getForProduct as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<ReviewsScreen />);

    expect(await screen.findByText('Loading reviews...')).toBeTruthy();
  });

  it('shows an error state with retry when loading fails', async () => {
    (ReviewRepository.getForProduct as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([REVIEW_5A]);
    await renderScreen(<ReviewsScreen />);

    const retryButton = await screen.findByText('Try Again');
    fireEvent.press(retryButton);

    expect(await screen.findByText(REVIEW_5A.text)).toBeTruthy();
    expect(ReviewRepository.getForProduct).toHaveBeenCalledTimes(2);
  });

  it('renders the summary average and total ratings', async () => {
    mockReviewRepo({ reviews: [REVIEW_5A, REVIEW_5B, REVIEW_3], summary: makeSummary() });
    await renderScreen(<ReviewsScreen />);

    expect(await screen.findByText('4.3')).toBeTruthy();
    expect(await screen.findByText('3 ratings')).toBeTruthy();
  });

  it('filters reviews by star rating, and pressing the same filter again resets to All', async () => {
    mockReviewRepo({ reviews: [REVIEW_5A, REVIEW_5B, REVIEW_3], summary: makeSummary() });
    await renderScreen(<ReviewsScreen />);
    await screen.findByText(REVIEW_3.text);

    fireEvent.press((await screen.findAllByText('5★'))[0]);
    expect(await screen.findByText(REVIEW_5A.text)).toBeTruthy();
    expect(screen.queryByText(REVIEW_3.text)).toBeNull();

    fireEvent.press((await screen.findAllByText('5★'))[0]);
    expect(await screen.findByText(REVIEW_3.text)).toBeTruthy();
  });

  it('shows the no-reviews-yet empty state when there is no filter and no reviews', async () => {
    mockReviewRepo({
      reviews: [],
      summary: makeSummary({
        total: 0,
        average: 0,
        distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })),
      }),
    });
    await renderScreen(<ReviewsScreen />);

    expect(await screen.findByText('Be the first to review this product.')).toBeTruthy();
  });

  it('shows a star-specific empty state when a filter matches nothing', async () => {
    mockReviewRepo({
      reviews: [REVIEW_5A],
      summary: makeSummary({
        total: 1,
        average: 5,
        distribution: [
          { star: 5, count: 1 },
          { star: 4, count: 0 },
          { star: 3, count: 0 },
          { star: 2, count: 0 },
          { star: 1, count: 0 },
        ],
      }),
    });
    await renderScreen(<ReviewsScreen />);
    await screen.findByText(REVIEW_5A.text);

    fireEvent.press((await screen.findAllByText('3★'))[0]);

    expect(await screen.findByText('No 3-star reviews yet.')).toBeTruthy();
  });

  it('pressing "Write a Review" navigates to WriteReview', async () => {
    mockReviewRepo({ reviews: [REVIEW_5A], summary: makeSummary() });
    await renderScreen(<ReviewsScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Write a Review' }));
    expect(mockNavigate).toHaveBeenCalledWith('WriteReview', { productId: 'p1' });
  });

  it('marks a review helpful', async () => {
    mockReviewRepo({ reviews: [REVIEW_5A, REVIEW_3], summary: makeSummary() });
    await renderScreen(<ReviewsScreen />);

    fireEvent.press(
      await screen.findByRole('button', {
        name: new RegExp(`Helpful \\(${REVIEW_3.helpfulCount}\\)`),
      })
    );
    expect(ReviewRepository.markHelpful).toHaveBeenCalledWith(REVIEW_3.id);
  });
});

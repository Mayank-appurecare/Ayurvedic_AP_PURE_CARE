import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { WriteReviewScreen } from '../WriteReviewScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { ReviewRepository } from '../../../repositories/ReviewRepository';
import { useAuth } from '../../../context/AuthContext';
import { User } from '../../../types';

jest.mock('../../../repositories/ReviewRepository', () => ({
  ReviewRepository: {
    addReview: jest.fn(),
  },
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { productId: 'p1' } }),
}));

const TITLE_PLACEHOLDER = 'Summarize your experience';
const TEXT_PLACEHOLDER = 'What did you like or dislike? How did this product work for you?';

function mockAuth(user: User | null) {
  (useAuth as jest.Mock).mockReturnValue({ user });
}

async function typeReviewText(text: string) {
  fireEvent.changeText(await screen.findByPlaceholderText(TEXT_PLACEHOLDER), text);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth({
    id: 'u1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9999999999',
    isGuest: false,
  });
  (ReviewRepository.addReview as jest.Mock).mockResolvedValue({});
});

describe('WriteReviewScreen', () => {
  it('labels star ratings with singular/plural wording', async () => {
    await renderScreen(<WriteReviewScreen />);

    expect(await screen.findByLabelText('Rate 1 star')).toBeTruthy();
    expect(await screen.findByLabelText('Rate 2 stars')).toBeTruthy();
    expect(await screen.findByLabelText('Rate 5 stars')).toBeTruthy();
  });

  it('shows no validation messages before a submit attempt', async () => {
    await renderScreen(<WriteReviewScreen />);
    await screen.findByLabelText('Rate 1 star');

    expect(screen.queryByText('Please select a rating.')).toBeNull();
    expect(screen.queryByText('Please write a review.')).toBeNull();
  });

  it('shows "Please select a rating." after a submit attempt with no rating chosen', async () => {
    await renderScreen(<WriteReviewScreen />);
    await typeReviewText('This product works great for me.');

    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('Please select a rating.')).toBeTruthy();
    expect(ReviewRepository.addReview).not.toHaveBeenCalled();
  });

  it('shows "Please write a review." after a submit attempt with empty text', async () => {
    await renderScreen(<WriteReviewScreen />);
    fireEvent.press(await screen.findByLabelText('Rate 4 stars'));

    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('Please write a review.')).toBeTruthy();
    expect(ReviewRepository.addReview).not.toHaveBeenCalled();
  });

  it('shows "Please write at least 10 characters." when the text is too short', async () => {
    await renderScreen(<WriteReviewScreen />);
    fireEvent.press(await screen.findByLabelText('Rate 4 stars'));
    await typeReviewText('too short');

    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    expect(await screen.findByText('Please write at least 10 characters.')).toBeTruthy();
    expect(ReviewRepository.addReview).not.toHaveBeenCalled();
  });

  it('submits a trimmed review, then shows a thank-you view and navigates back', async () => {
    await renderScreen(<WriteReviewScreen />);

    fireEvent.press(await screen.findByLabelText('Rate 4 stars'));
    fireEvent.changeText(
      await screen.findByPlaceholderText(TITLE_PLACEHOLDER),
      '  Great product  '
    );
    await typeReviewText('  Really helped my digestion over the month.  ');
    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    await waitFor(() =>
      expect(ReviewRepository.addReview).toHaveBeenCalledWith({
        productId: 'p1',
        customerName: 'Priya Sharma',
        rating: 4,
        verifiedPurchase: true,
        title: 'Great product',
        text: 'Really helped my digestion over the month.',
        images: [],
      })
    );
    expect(await screen.findByText('Thank you for your review!')).toBeTruthy();

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled(), { timeout: 2000 });
  }, 10000);

  it('leaves the title undefined when left blank', async () => {
    await renderScreen(<WriteReviewScreen />);

    fireEvent.press(await screen.findByLabelText('Rate 3 stars'));
    await typeReviewText('No complaints, does what it says.');
    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    await waitFor(() =>
      expect(ReviewRepository.addReview).toHaveBeenCalledWith(
        expect.objectContaining({ title: undefined })
      )
    );
    // Wait out the post-submit navigation's real setTimeout so it fires here
    // instead of leaking into (and warning during) a later test.
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled(), { timeout: 2000 });
  }, 10000);

  it('uses "Guest User" as the customer name when there is no signed-in user', async () => {
    mockAuth(null);
    await renderScreen(<WriteReviewScreen />);

    fireEvent.press(await screen.findByLabelText('Rate 5 stars'));
    await typeReviewText('Excellent quality and fast delivery.');
    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    await waitFor(() =>
      expect(ReviewRepository.addReview).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Guest User' })
      )
    );
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled(), { timeout: 2000 });
  }, 10000);

  it('uses "Guest User" as the customer name for a guest session', async () => {
    mockAuth({ id: 'g1', name: '', email: '', phone: '', isGuest: true });
    await renderScreen(<WriteReviewScreen />);

    fireEvent.press(await screen.findByLabelText('Rate 5 stars'));
    await typeReviewText('Excellent quality and fast delivery.');
    fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

    await waitFor(() =>
      expect(ReviewRepository.addReview).toHaveBeenCalledWith(
        expect.objectContaining({ customerName: 'Guest User' })
      )
    );
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled(), { timeout: 2000 });
  }, 10000);
});

import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
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
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
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

function mockPickedPhoto(uri: string) {
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri }],
  });
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
  (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
    granted: true,
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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

  describe('attaching photos', () => {
    it('adds a picked photo as a thumbnail with a remove button', async () => {
      mockPickedPhoto('file://photo-1.jpg');
      await renderScreen(<WriteReviewScreen />);

      expect(screen.queryByLabelText('Remove photo 1')).toBeNull();
      await fireEvent.press(await screen.findByLabelText('Add photo'));

      expect(await screen.findByLabelText('Remove photo 1')).toBeTruthy();
    });

    it('shows a permission alert and adds nothing when photo access is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      await renderScreen(<WriteReviewScreen />);
      await fireEvent.press(await screen.findByLabelText('Add photo'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Remove photo 1')).toBeNull();
    });

    it('adds nothing when the user cancels the picker', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      await renderScreen(<WriteReviewScreen />);
      await fireEvent.press(await screen.findByLabelText('Add photo'));

      expect(screen.queryByLabelText('Remove photo 1')).toBeNull();
      expect(await screen.findByLabelText('Add photo')).toBeTruthy();
    });

    it('hides the Add photo button once the 3-photo cap is reached', async () => {
      mockPickedPhoto('file://photo-1.jpg');
      mockPickedPhoto('file://photo-2.jpg');
      mockPickedPhoto('file://photo-3.jpg');
      await renderScreen(<WriteReviewScreen />);

      await fireEvent.press(await screen.findByLabelText('Add photo'));
      await fireEvent.press(await screen.findByLabelText('Add photo'));
      await fireEvent.press(await screen.findByLabelText('Add photo'));

      expect(await screen.findByLabelText('Remove photo 3')).toBeTruthy();
      expect(screen.queryByLabelText('Add photo')).toBeNull();
    });

    it('removing a photo brings back the Add photo button', async () => {
      mockPickedPhoto('file://photo-1.jpg');
      await renderScreen(<WriteReviewScreen />);
      await fireEvent.press(await screen.findByLabelText('Add photo'));
      await screen.findByLabelText('Remove photo 1');

      await fireEvent.press(await screen.findByLabelText('Remove photo 1'));

      expect(screen.queryByLabelText('Remove photo 1')).toBeNull();
      expect(await screen.findByLabelText('Add photo')).toBeTruthy();
    });

    it('submits the review with the picked photo URIs', async () => {
      mockPickedPhoto('file://photo-1.jpg');
      await renderScreen(<WriteReviewScreen />);
      await fireEvent.press(await screen.findByLabelText('Add photo'));
      await screen.findByLabelText('Remove photo 1');

      fireEvent.press(await screen.findByLabelText('Rate 5 stars'));
      await typeReviewText('Loved the packaging and the product both.');
      fireEvent.press(await screen.findByRole('button', { name: 'Submit Review' }));

      await waitFor(() =>
        expect(ReviewRepository.addReview).toHaveBeenCalledWith(
          expect.objectContaining({ images: ['file://photo-1.jpg'] })
        )
      );
      await waitFor(() => expect(mockGoBack).toHaveBeenCalled(), { timeout: 2000 });
    }, 10000);
  });
});

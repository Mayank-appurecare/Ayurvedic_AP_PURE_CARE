import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { MyReviewsScreen } from '../MyReviewsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { useAuth } from '../../../context/AuthContext';

// Fixed, self-contained review fixtures (no outer-scope references, since
// jest.mock factories can't close over plain top-level consts). Test cases
// vary which reviews are "the current user's" by mocking the signed-in
// user's name, not by changing this data.
jest.mock('../../../data/reviews', () => ({
  reviews: [
    {
      id: 'r1',
      productId: 'p1',
      customerName: 'Jane Doe',
      rating: 5,
      date: '2026-08-01',
      verifiedPurchase: true,
      title: 'Great capsules',
      text: 'Really helped me sleep better.',
      images: [],
      helpfulCount: 3,
    },
    {
      id: 'r2',
      productId: 'p2',
      customerName: 'Jane Doe',
      rating: 4,
      date: '2026-07-01',
      verifiedPurchase: true,
      text: 'Good oil, absorbs well.',
      images: [],
      helpfulCount: 1,
    },
    {
      id: 'r3',
      productId: 'p3',
      customerName: 'Someone Else',
      rating: 2,
      date: '2026-06-01',
      verifiedPurchase: false,
      text: 'Not for me.',
      images: [],
      helpfulCount: 0,
    },
  ],
}));
jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: { getById: jest.fn() },
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

function mockUser(name: string | undefined) {
  (useAuth as jest.Mock).mockReturnValue({ user: name ? { name } : null });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MyReviewsScreen', () => {
  it('shows the loading state while product names are being fetched', async () => {
    mockUser('Jane Doe');
    (ProductRepository.getById as jest.Mock).mockReturnValue(new Promise(() => {}));

    await renderScreen(<MyReviewsScreen />);

    expect(await screen.findByText('Loading your reviews...')).toBeTruthy();
  });

  it('shows an empty state prompting to browse products when the user has no reviews', async () => {
    mockUser('Nobody Matches');

    await renderScreen(<MyReviewsScreen />);

    expect(await screen.findByText("You haven't written any reviews yet")).toBeTruthy();
    expect(ProductRepository.getById).not.toHaveBeenCalled();

    fireEvent.press(await screen.findByRole('button', { name: 'Browse Products' }));
    expect(mockNavigate).toHaveBeenCalledWith('Main');
  });

  it("loads and renders each of the user's reviews together with its product name", async () => {
    mockUser('Jane Doe');
    (ProductRepository.getById as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(id === 'p1' ? { name: 'Ashwagandha Capsules' } : { name: 'Bhringraj Oil' })
    );

    await renderScreen(<MyReviewsScreen />);

    expect(await screen.findByText('Ashwagandha Capsules')).toBeTruthy();
    expect(await screen.findByText('Bhringraj Oil')).toBeTruthy();
    expect(await screen.findByText('Really helped me sleep better.')).toBeTruthy();
    expect(await screen.findByText('Good oil, absorbs well.')).toBeTruthy();
    expect(ProductRepository.getById).toHaveBeenCalledWith('p1');
    expect(ProductRepository.getById).toHaveBeenCalledWith('p2');
  });

  it("does not include another customer's review", async () => {
    mockUser('Jane Doe');
    (ProductRepository.getById as jest.Mock).mockResolvedValue({ name: 'Product X' });

    await renderScreen(<MyReviewsScreen />);

    await screen.findByText('Really helped me sleep better.');
    expect(screen.queryByText('Not for me.')).toBeNull();
    expect(ProductRepository.getById).not.toHaveBeenCalledWith('p3');
  });

  it('falls back to "Product" when the product can no longer be found', async () => {
    mockUser('Jane Doe');
    (ProductRepository.getById as jest.Mock).mockResolvedValue(undefined);

    await renderScreen(<MyReviewsScreen />);

    expect(await screen.findAllByText('Product')).toHaveLength(2);
  });
});

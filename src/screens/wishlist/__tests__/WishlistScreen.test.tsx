import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { WishlistScreen } from '../WishlistScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { aProduct } from '../../../test-utils/fixtures';

jest.mock('../../../context/WishlistContext', () => ({ useWishlist: jest.fn() }));
jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));
jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: { getById: jest.fn() },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockCanGoBack = false;
let mockNavigatorType = 'tab';
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => mockCanGoBack,
    getState: () => ({ type: mockNavigatorType }),
  }),
}));

function mockWishlist(wishlistIds: string[] = []) {
  (useWishlist as jest.Mock).mockReturnValue({
    wishlistIds,
    isWishlisted: jest.fn().mockReturnValue(true),
    toggleWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack = false;
  mockNavigatorType = 'tab';
  mockWishlist([]);
  (useCart as jest.Mock).mockReturnValue({
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    isInCart: jest.fn().mockReturnValue(false),
    quantityOf: jest.fn().mockReturnValue(0),
  });
});

describe('WishlistScreen', () => {
  it('shows a loading state while wishlist products are being fetched', async () => {
    mockWishlist(['p1']);
    (ProductRepository.getById as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await renderScreen(<WishlistScreen />);

    expect(await screen.findByText('Loading your wishlist...')).toBeTruthy();
  });

  it('shows the empty state when the wishlist has no ids, and Explore Products navigates to Main', async () => {
    await renderScreen(<WishlistScreen />);

    expect(await screen.findByText('Your wishlist is empty')).toBeTruthy();

    fireEvent.press(await screen.findByRole('button', { name: 'Explore Products' }));
    expect(mockNavigate).toHaveBeenCalledWith('Main');
  });

  it('renders one card per resolved product and filters out a stale id that resolves to undefined', async () => {
    mockWishlist(['p1', 'gone']);
    const p1 = aProduct({ id: 'p1', name: 'Ashwagandha Churna' });
    (ProductRepository.getById as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(id === 'p1' ? p1 : undefined)
    );

    await renderScreen(<WishlistScreen />);

    expect(await screen.findByText('Ashwagandha Churna')).toBeTruthy();
    expect(screen.queryByText('Your wishlist is empty')).toBeNull();
  });

  it('navigates to ProductDetail when a wishlist card is pressed', async () => {
    mockWishlist(['p1']);
    const p1 = aProduct({ id: 'p1', name: 'Ashwagandha Churna' });
    (ProductRepository.getById as jest.Mock).mockResolvedValue(p1);

    await renderScreen(<WishlistScreen />);
    fireEvent.press(await screen.findByText('Ashwagandha Churna'));

    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { productId: 'p1' });
  });

  it('shows the back button and calls goBack when the screen can go back', async () => {
    mockCanGoBack = true;

    await renderScreen(<WishlistScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Go back' }));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

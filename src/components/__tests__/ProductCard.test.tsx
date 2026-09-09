import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import { renderScreen } from '../../test-utils/renderScreen';
import { aProduct } from '../../test-utils/fixtures';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

jest.mock('../../context/CartContext', () => ({
  useCart: jest.fn(),
}));
jest.mock('../../context/WishlistContext', () => ({
  useWishlist: jest.fn(),
}));

function mockCart(overrides: Partial<ReturnType<typeof useCart>> = {}) {
  (useCart as jest.Mock).mockReturnValue({
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    quantityOf: jest.fn().mockReturnValue(0),
    ...overrides,
  });
}

function mockWishlist(overrides: Partial<ReturnType<typeof useWishlist>> = {}) {
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: jest.fn().mockReturnValue(false),
    toggleWishlist: jest.fn(),
    ...overrides,
  });
}

const PRODUCT = aProduct({
  id: 'p1',
  name: 'Ashwagandha Capsules',
  brand: 'AP Pure Care',
  price: 199,
  mrp: 249,
  stock: 50,
  variants: [{ id: 'v1', label: '60caps', price: 199, mrp: 249, stock: 50 }],
});

const mockOnPress = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockCart();
  mockWishlist();
});

describe('ProductCard', () => {
  it('renders the name, brand, and price', async () => {
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    expect(await screen.findByText('Ashwagandha Capsules')).toBeTruthy();
    expect(screen.getByText('AP Pure Care')).toBeTruthy();
    expect(screen.getByText('₹199')).toBeTruthy();
  });

  it('pressing the card calls onPress', async () => {
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    fireEvent.press(await screen.findByLabelText('Ashwagandha Capsules'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows an Add button when nothing of this product is in the cart, and pressing it adds one unit', async () => {
    const addToCart = jest.fn();
    mockCart({ addToCart, quantityOf: jest.fn().mockReturnValue(0) });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    // Both this button and the wishlist button's accessible name contain
    // "Add" ("Add" vs "Add to wishlist") — the wishlist button is the only
    // one of the two with an explicit accessibilityLabel prop set.
    const candidates = await screen.findAllByRole('button', { name: /Add/ });
    const addButton = candidates.find((b) => !b.props.accessibilityLabel);
    expect(addButton).toBeTruthy();
    fireEvent.press(addButton!);

    expect(addToCart).toHaveBeenCalledWith('p1', 'v1');
  });

  it('shows a quantity stepper instead of Add once the product is already in the cart', async () => {
    mockCart({ quantityOf: jest.fn().mockReturnValue(3) });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Add$/ })).toBeNull();
  });

  it('pressing + on the stepper increases the quantity via updateQuantity', async () => {
    const updateQuantity = jest.fn();
    mockCart({ updateQuantity, quantityOf: jest.fn().mockReturnValue(3) });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    fireEvent.press(await screen.findByLabelText('Increase quantity'));
    expect(updateQuantity).toHaveBeenCalledWith('p1', 'v1', 4);
  });

  it('pressing - on the stepper decreases the quantity via updateQuantity', async () => {
    const updateQuantity = jest.fn();
    mockCart({ updateQuantity, quantityOf: jest.fn().mockReturnValue(3) });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    fireEvent.press(await screen.findByLabelText('Decrease quantity'));
    expect(updateQuantity).toHaveBeenCalledWith('p1', 'v1', 2);
  });

  it('caps the stepper at the product stock', async () => {
    mockCart({ quantityOf: jest.fn().mockReturnValue(50) });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    const increaseButton = await screen.findByLabelText('Increase quantity');
    expect(increaseButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows "Notify Me" and disables adding when out of stock', async () => {
    await renderScreen(<ProductCard product={{ ...PRODUCT, stock: 0 }} onPress={mockOnPress} />);

    const button = await screen.findByRole('button', { name: /Notify Me/ });
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("toggles the wishlist without triggering the card's own onPress", async () => {
    const toggleWishlist = jest.fn();
    mockWishlist({ toggleWishlist });
    await renderScreen(<ProductCard product={PRODUCT} onPress={mockOnPress} />);

    fireEvent.press(await screen.findByLabelText('Add to wishlist'));
    expect(toggleWishlist).toHaveBeenCalledWith('p1');
  });
});

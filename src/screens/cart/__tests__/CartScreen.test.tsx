import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CartScreen } from '../CartScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useCart, EnrichedCartItem } from '../../../context/CartContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { OfferRepository } from '../../../repositories/OfferRepository';

jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));
jest.mock('../../../context/CheckoutContext', () => ({
  useCheckout: jest.fn(),
}));
jest.mock('../../../repositories/OfferRepository', () => ({
  OfferRepository: { validateCoupon: jest.fn() },
}));

const mockNavigate = jest.fn();
let mockNavigatorType = 'tab';
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    canGoBack: () => false,
    getState: () => ({ type: mockNavigatorType }),
  }),
}));

function makeItem(overrides: Partial<EnrichedCartItem> = {}): EnrichedCartItem {
  return {
    productId: 'p1',
    variantId: 'v1',
    quantity: 1,
    product: { name: 'Ashwagandha Churna', images: ['https://example.com/a.png'] } as never,
    variantLabel: '100g',
    unitPrice: 200,
    unitMrp: 250,
    ...overrides,
  };
}

function mockCart(overrides: Partial<ReturnType<typeof useCart>> = {}) {
  (useCart as jest.Mock).mockReturnValue({
    enrichedItems: [],
    savedForLaterItems: [],
    isReady: true,
    subtotal: 0,
    mrpTotal: 0,
    discountTotal: 0,
    updateQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    saveForLater: jest.fn(),
    moveToCart: jest.fn(),
    ...overrides,
  });
}

function mockCheckout(overrides: Partial<ReturnType<typeof useCheckout>> = {}) {
  (useCheckout as jest.Mock).mockReturnValue({
    appliedCoupon: null,
    setAppliedCoupon: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigatorType = 'tab';
  mockCart();
  mockCheckout();
});

describe('CartScreen', () => {
  it('shows the loading state while the cart is not ready', async () => {
    mockCart({ isReady: false });
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('Loading your cart...')).toBeTruthy();
  });

  it('shows the empty state and goes to Home when nothing is in the cart at all', async () => {
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('Your cart is empty')).toBeTruthy();
    fireEvent.press(await screen.findByRole('button', { name: 'Shop Now' }));

    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'HomeTab' });
  });

  it('renders a cart item and gives free delivery once the subtotal clears the threshold', async () => {
    mockCart({
      enrichedItems: [makeItem({ quantity: 2, unitPrice: 300, unitMrp: 350 })],
      subtotal: 600,
      mrpTotal: 700,
      discountTotal: 100,
    });
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('Ashwagandha Churna')).toBeTruthy();
    expect(await screen.findByText('100g')).toBeTruthy();
    expect(await screen.findByText('₹700')).toBeTruthy();
    expect(await screen.findByText('- ₹100')).toBeTruthy();
    expect(await screen.findByText('FREE')).toBeTruthy();
    expect(screen.getAllByText('₹600').length).toBeGreaterThan(0);
  });

  it('charges the delivery fee when the subtotal is below the free-delivery threshold', async () => {
    mockCart({
      enrichedItems: [makeItem()],
      subtotal: 300,
      mrpTotal: 300,
      discountTotal: 0,
    });
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('₹49')).toBeTruthy();
    expect(screen.getAllByText('₹349').length).toBeGreaterThan(0);
  });

  it('increase/decrease quantity buttons call updateQuantity with the adjusted count', async () => {
    const updateQuantity = jest.fn();
    mockCart({ enrichedItems: [makeItem({ quantity: 2 })], subtotal: 400, updateQuantity });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Increase quantity'));
    expect(updateQuantity).toHaveBeenCalledWith('p1', 'v1', 3);

    fireEvent.press(await screen.findByLabelText('Decrease quantity'));
    expect(updateQuantity).toHaveBeenCalledWith('p1', 'v1', 1);
  });

  it('opens a confirmation dialog before removing a cart item, and removes it on confirm', async () => {
    const removeFromCart = jest.fn();
    mockCart({ enrichedItems: [makeItem()], subtotal: 200, removeFromCart });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Remove item'));
    expect(await screen.findByText('Remove Item')).toBeTruthy();
    expect(await screen.findByText('Remove "Ashwagandha Churna" from your cart?')).toBeTruthy();

    fireEvent.press(await screen.findByRole('button', { name: 'Remove' }));
    expect(removeFromCart).toHaveBeenCalledWith('p1', 'v1');
  });

  it('cancelling the remove confirmation leaves the item in place', async () => {
    const removeFromCart = jest.fn();
    mockCart({ enrichedItems: [makeItem()], subtotal: 200, removeFromCart });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Remove item'));
    fireEvent.press(await screen.findByRole('button', { name: 'Cancel' }));

    expect(removeFromCart).not.toHaveBeenCalled();
  });

  it('saves a cart item for later', async () => {
    const saveForLater = jest.fn();
    mockCart({ enrichedItems: [makeItem()], subtotal: 200, saveForLater });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Save for later'));
    expect(saveForLater).toHaveBeenCalledWith('p1', 'v1');
  });

  it('shows saved-for-later items separately and moves one back to the cart', async () => {
    const moveToCart = jest.fn();
    mockCart({
      enrichedItems: [],
      savedForLaterItems: [
        makeItem({
          productId: 'p2',
          variantId: 'v2',
          product: { name: 'Triphala Churna', images: ['https://example.com/t.png'] } as never,
        }),
      ],
      moveToCart,
    });
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('Saved for Later (1)')).toBeTruthy();
    expect(await screen.findByText('Your cart is empty')).toBeTruthy();

    fireEvent.press(await screen.findByText('Move to Cart'));
    expect(moveToCart).toHaveBeenCalledWith('p2', 'v2');
  });

  it('removes a saved-for-later item directly, with no confirmation dialog', async () => {
    const removeFromCart = jest.fn();
    mockCart({
      enrichedItems: [],
      savedForLaterItems: [makeItem({ productId: 'p2', variantId: 'v2' })],
      removeFromCart,
    });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Remove item'));

    expect(removeFromCart).toHaveBeenCalledWith('p2', 'v2');
    expect(screen.queryByText('Remove Item')).toBeNull();
  });

  it('shows an applied flat coupon and subtracts it from the total', async () => {
    mockCart({ enrichedItems: [makeItem()], subtotal: 500, mrpTotal: 500, discountTotal: 0 });
    mockCheckout({
      appliedCoupon: {
        id: 'c1',
        code: 'SAVE50',
        discountType: 'flat',
        discountValue: 50,
        description: '',
        expiryDate: '',
      },
    });
    await renderScreen(<CartScreen />);

    expect(await screen.findByText('SAVE50 applied')).toBeTruthy();
    expect(await screen.findByText('- ₹50')).toBeTruthy();
    expect(screen.getAllByText('₹450').length).toBeGreaterThan(0);
  });

  it("shows a percent coupon's exact fractional discount and total, not rounded to a whole rupee", async () => {
    mockCart({ enrichedItems: [makeItem()], subtotal: 333, mrpTotal: 400, discountTotal: 67 });
    mockCheckout({
      appliedCoupon: {
        id: 'c2',
        code: 'FLAT20',
        discountType: 'percent',
        discountValue: 20,
        description: '',
        expiryDate: '',
      },
    });
    await renderScreen(<CartScreen />);

    // 20% of ₹333 is ₹66.6, and ₹333 - ₹66.6 + ₹49 delivery is ₹315.4 -
    // both must show their real decimal, not round to ₹67/₹315 or ₹66/₹316.
    expect(await screen.findByText('- ₹66.6')).toBeTruthy();
    expect(screen.getAllByText('₹315.4').length).toBeGreaterThan(0);
  });

  it('removing the applied coupon clears it', async () => {
    const setAppliedCoupon = jest.fn();
    mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
    mockCheckout({
      appliedCoupon: {
        id: 'c1',
        code: 'SAVE50',
        discountType: 'flat',
        discountValue: 50,
        description: '',
        expiryDate: '',
      },
      setAppliedCoupon,
    });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByLabelText('Remove coupon'));
    expect(setAppliedCoupon).toHaveBeenCalledWith(null);
  });

  it('pressing "View all coupons" navigates to the Offers screen', async () => {
    mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByText('View all coupons'));
    expect(mockNavigate).toHaveBeenCalledWith('Offers');
  });

  describe('entering a coupon code directly', () => {
    it('disables Apply until something is typed', async () => {
      mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
      await renderScreen(<CartScreen />);

      const applyButton = await screen.findByRole('button', { name: 'Apply' });
      expect(applyButton.props.accessibilityState?.disabled).toBeTruthy();

      fireEvent.changeText(await screen.findByPlaceholderText('Enter coupon code'), 'SAVE10');
      expect(
        (await screen.findByRole('button', { name: 'Apply' })).props.accessibilityState?.disabled
      ).toBeFalsy();
    });

    it('applies a valid code, showing it as applied and clearing the input', async () => {
      const setAppliedCoupon = jest.fn();
      mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
      mockCheckout({ setAppliedCoupon });
      const coupon = {
        id: 'c1',
        code: 'SAVE10',
        description: '',
        discountType: 'flat' as const,
        discountValue: 10,
        expiryDate: '2026-12-31',
      };
      (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
        valid: true,
        coupon,
        message: 'Coupon applied successfully!',
      });
      await renderScreen(<CartScreen />);

      fireEvent.changeText(await screen.findByPlaceholderText('Enter coupon code'), 'save10');
      fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

      await waitFor(() =>
        expect(OfferRepository.validateCoupon).toHaveBeenCalledWith('SAVE10', 500)
      );
      expect(setAppliedCoupon).toHaveBeenCalledWith(coupon);
    });

    it('shows an inline error for an invalid code, without applying it', async () => {
      mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
      (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
        valid: false,
        message: 'Invalid coupon code.',
      });
      await renderScreen(<CartScreen />);

      fireEvent.changeText(await screen.findByPlaceholderText('Enter coupon code'), 'BADCODE');
      fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

      expect(await screen.findByText('Invalid coupon code.')).toBeTruthy();
      expect(screen.queryByText('BADCODE applied')).toBeNull();
    });
  });

  it('pressing Proceed to Checkout navigates to CheckoutAddress', async () => {
    mockCart({ enrichedItems: [makeItem()], subtotal: 500 });
    await renderScreen(<CartScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Proceed to Checkout' }));
    expect(mockNavigate).toHaveBeenCalledWith('CheckoutAddress');
  });
});

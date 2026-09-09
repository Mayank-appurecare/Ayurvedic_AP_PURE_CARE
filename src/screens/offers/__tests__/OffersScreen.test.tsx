import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OffersScreen } from '../OffersScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { OfferRepository } from '../../../repositories/OfferRepository';
import { useCart } from '../../../context/CartContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { Coupon, Offer } from '../../../types';

jest.mock('../../../repositories/OfferRepository', () => ({
  OfferRepository: { getOffers: jest.fn(), getCoupons: jest.fn(), validateCoupon: jest.fn() },
}));
jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));
jest.mock('../../../context/CheckoutContext', () => ({ useCheckout: jest.fn() }));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
}));

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'coupon-1',
    code: 'SAVE10',
    description: 'Flat discount on your order',
    discountType: 'flat',
    discountValue: 10,
    minOrderValue: 100,
    expiryDate: '2026-12-31',
    isApplicable: true,
    ...overrides,
  };
}

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'offer-1',
    title: 'Immunity Season Sale',
    subtitle: 'Up to 25% off on immunity essentials',
    image: 'https://example.com/offer.png',
    badge: '25% OFF',
    ...overrides,
  };
}

function mockOfferData({
  offers = [makeOffer()],
  coupons = [makeCoupon()],
}: { offers?: Offer[]; coupons?: Coupon[] } = {}) {
  (OfferRepository.getOffers as jest.Mock).mockResolvedValue(offers);
  (OfferRepository.getCoupons as jest.Mock).mockResolvedValue(coupons);
}

// useCheckout is mocked, so calling the mocked setAppliedCoupon does not by
// itself make a later useCheckout() call return the new value the way real
// context state would. Backing it with a plain variable — mutated
// synchronously by setAppliedCoupon, read fresh on every mocked call — means
// the next render (triggered by the screen's own real setState calls in the
// same handler) picks up the change, same as the real context would.
let mockAppliedCoupon: Coupon | null = null;
const mockSetAppliedCoupon = jest.fn((coupon: Coupon | null) => {
  mockAppliedCoupon = coupon;
});
function mockCheckout() {
  (useCheckout as jest.Mock).mockImplementation(() => ({
    appliedCoupon: mockAppliedCoupon,
    setAppliedCoupon: mockSetAppliedCoupon,
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAppliedCoupon = null;
  (useCart as jest.Mock).mockReturnValue({ subtotal: 500 });
  mockCheckout();
  mockOfferData();
});

describe('OffersScreen data loading', () => {
  it('shows the loading state until offers and coupons resolve', async () => {
    (OfferRepository.getOffers as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<OffersScreen />);

    expect(await screen.findByText('Loading offers...')).toBeTruthy();
  });

  it('renders the offers rail and the coupon list once loaded', async () => {
    mockOfferData({
      offers: [makeOffer({ title: 'Immunity Season Sale', subtitle: 'Up to 25% off' })],
      coupons: [
        makeCoupon({ description: 'Flat ₹100 off on your first order', code: 'APWELCOME' }),
      ],
    });
    await renderScreen(<OffersScreen />);

    expect(await screen.findByText('Available Coupons')).toBeTruthy();
    expect(screen.getByText('Immunity Season Sale')).toBeTruthy();
    expect(screen.getByText('Up to 25% off')).toBeTruthy();
    expect(screen.getByText('Flat ₹100 off on your first order')).toBeTruthy();
    expect(screen.getByText('APWELCOME')).toBeTruthy();
  });
});

describe('OffersScreen applying a coupon', () => {
  it('applying a valid coupon validates it against the cart subtotal and shows it as Applied', async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
      valid: true,
      coupon,
      message: 'Coupon applied successfully!',
    });

    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Applied')).toBeTruthy();
    expect(OfferRepository.validateCoupon).toHaveBeenCalledWith('SAVE10', 500);
    expect(mockSetAppliedCoupon).toHaveBeenCalledWith(coupon);
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  });

  it('applying an invalid coupon shows an inline error, without applying it', async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
      valid: false,
      message: 'Add items worth ₹50 more to use this coupon.',
    });

    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Add items worth ₹50 more to use this coupon.')).toBeTruthy();
    expect(mockSetAppliedCoupon).not.toHaveBeenCalled();
    expect(screen.queryByText('Applied')).toBeNull();
  });

  it("clears a coupon's inline error once that same coupon is applied successfully afterwards", async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    (OfferRepository.validateCoupon as jest.Mock)
      .mockResolvedValueOnce({ valid: false, message: 'Invalid coupon code.' })
      .mockResolvedValueOnce({ valid: true, coupon, message: 'Coupon applied successfully!' });

    await renderScreen(<OffersScreen />);
    const applyButton = await screen.findByRole('button', { name: 'Apply' });

    fireEvent.press(applyButton);
    expect(await screen.findByText('Invalid coupon code.')).toBeTruthy();

    fireEvent.press(applyButton);
    await waitFor(() => expect(screen.getByText('Applied')).toBeTruthy());
    expect(screen.queryByText('Invalid coupon code.')).toBeNull();
  });

  it("keeps a failed coupon's error scoped to that coupon only", async () => {
    const couponA = makeCoupon({ id: 'c1', code: 'SAVE10', description: 'Coupon A' });
    const couponB = makeCoupon({ id: 'c2', code: 'SAVE20', description: 'Coupon B' });
    mockOfferData({ coupons: [couponA, couponB] });
    (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
      valid: false,
      message: 'Invalid coupon code.',
    });

    await renderScreen(<OffersScreen />);
    const applyButtons = await screen.findAllByRole('button', { name: 'Apply' });
    fireEvent.press(applyButtons[0]);

    expect(await screen.findByText('Invalid coupon code.')).toBeTruthy();
    expect(screen.getAllByText('Invalid coupon code.')).toHaveLength(1);
  });

  it('shows the already-applied coupon as Applied on load, without needing to press Apply', async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    mockAppliedCoupon = coupon;

    await renderScreen(<OffersScreen />);

    expect(await screen.findByText('Applied')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  });
});

describe('OffersScreen navigation', () => {
  it('goes back when the header back button is pressed', async () => {
    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

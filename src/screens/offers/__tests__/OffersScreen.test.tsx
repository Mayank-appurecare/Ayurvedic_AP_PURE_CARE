import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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

beforeEach(() => {
  jest.clearAllMocks();
  (useCart as jest.Mock).mockReturnValue({ subtotal: 500 });
  (useCheckout as jest.Mock).mockReturnValue({ setAppliedCoupon: jest.fn() });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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
  it('applying a valid coupon validates it against the cart subtotal, applies it and shows a success alert', async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    const setAppliedCoupon = jest.fn();
    (useCheckout as jest.Mock).mockReturnValue({ setAppliedCoupon });
    (useCart as jest.Mock).mockReturnValue({ subtotal: 500 });
    (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
      valid: true,
      coupon,
      message: 'Coupon applied successfully!',
    });

    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

    await screen.findByText('SAVE10');
    expect(OfferRepository.validateCoupon).toHaveBeenCalledWith('SAVE10', 500);
    expect(setAppliedCoupon).toHaveBeenCalledWith(coupon);
    expect(Alert.alert).toHaveBeenCalledWith('Coupon Applied', 'Coupon applied successfully!');
  });

  it('applying an invalid coupon shows an inline error and a failure alert, without applying it', async () => {
    const coupon = makeCoupon({ id: 'c1', code: 'SAVE10' });
    mockOfferData({ coupons: [coupon] });
    const setAppliedCoupon = jest.fn();
    (useCheckout as jest.Mock).mockReturnValue({ setAppliedCoupon });
    (OfferRepository.validateCoupon as jest.Mock).mockResolvedValue({
      valid: false,
      message: 'Add items worth ₹50 more to use this coupon.',
    });

    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Add items worth ₹50 more to use this coupon.')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Coupon Not Applied',
      'Add items worth ₹50 more to use this coupon.'
    );
    expect(setAppliedCoupon).not.toHaveBeenCalled();
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
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith('Coupon Applied', 'Coupon applied successfully!')
    );
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
});

describe('OffersScreen navigation', () => {
  it('goes back when the header back button is pressed', async () => {
    await renderScreen(<OffersScreen />);
    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

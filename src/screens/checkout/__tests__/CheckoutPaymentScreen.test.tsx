import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutPaymentScreen } from '../CheckoutPaymentScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useCheckout } from '../../../context/CheckoutContext';
import { useCart } from '../../../context/CartContext';
import { OrderRepository } from '../../../repositories/OrderRepository';
import { Address } from '../../../types';

jest.mock('../../../context/CheckoutContext', () => ({
  useCheckout: jest.fn(),
}));
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));
jest.mock('../../../repositories/OrderRepository', () => ({
  OrderRepository: { placeOrder: jest.fn() },
}));

const mockReset = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: mockReset, goBack: mockGoBack, navigate: jest.fn() }),
}));

const ADDRESS: Address = {
  id: 'addr-1',
  label: 'Home',
  fullName: 'Test User',
  phone: '9999999999',
  line1: '123 Test St',
  city: 'Bengaluru',
  state: 'KA',
  pincode: '560001',
};

const ENRICHED_ITEM = {
  productId: 'p1',
  variantId: 'v1',
  quantity: 2,
  product: { name: 'Ashwagandha', images: ['https://example.com/a.png'] },
  variantLabel: '100g',
  unitPrice: 100,
  unitMrp: 120,
};

function mockCheckout(overrides: Partial<ReturnType<typeof useCheckout>> = {}) {
  (useCheckout as jest.Mock).mockReturnValue({
    selectedAddress: ADDRESS,
    selectedDelivery: {
      id: 'delivery-standard',
      name: 'Standard',
      description: '',
      price: 0,
      etaLabel: '',
    },
    appliedCoupon: null,
    selectedPaymentMethodId: null,
    setSelectedPaymentMethodId: jest.fn(),
    ...overrides,
  });
}

function mockCart(overrides: Partial<ReturnType<typeof useCart>> = {}) {
  (useCart as jest.Mock).mockReturnValue({
    enrichedItems: [ENRICHED_ITEM],
    subtotal: 200,
    clearCart: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckout();
  mockCart();
});

describe('CheckoutPaymentScreen', () => {
  it('disables Place Order until a payment method is selected', async () => {
    await renderScreen(<CheckoutPaymentScreen />);
    const button = await screen.findByRole('button', { name: /Place Order/ });
    expect(button.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('enables Place Order once a payment method is chosen', async () => {
    mockCheckout({ selectedPaymentMethodId: 'pay-upi' });
    await renderScreen(<CheckoutPaymentScreen />);
    const button = await screen.findByRole('button', { name: /Place Order/ });
    expect(button.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('computes the total as subtotal - coupon discount + delivery fee', async () => {
    mockCheckout({
      selectedPaymentMethodId: 'pay-upi',
      appliedCoupon: { code: 'SAVE10', discountType: 'flat', discountValue: 30 } as never,
      selectedDelivery: { id: 'd', name: 'Express', description: '', price: 49, etaLabel: '' },
    });
    mockCart({ subtotal: 200 });
    await renderScreen(<CheckoutPaymentScreen />);
    // 200 - 30 + 49 = 219
    expect(await screen.findAllByText(/219/)).not.toHaveLength(0);
  });

  it('places the order with the correct payload, clears the cart, and resets to OrderConfirmation', async () => {
    mockCheckout({ selectedPaymentMethodId: 'pay-upi' });
    const clearCart = jest.fn();
    mockCart({ clearCart });
    (OrderRepository.placeOrder as jest.Mock).mockResolvedValue({ id: 'ord-123' });

    await renderScreen(<CheckoutPaymentScreen />);
    const button = await screen.findByRole('button', { name: /Place Order/ });
    fireEvent.press(button);

    await waitFor(() => expect(OrderRepository.placeOrder).toHaveBeenCalledTimes(1));
    expect(OrderRepository.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 200,
        discount: 0,
        deliveryFee: 0,
        total: 200,
        address: ADDRESS,
        paymentMethod: 'UPI',
        items: [
          expect.objectContaining({ productId: 'p1', variantId: 'v1', quantity: 2, price: 100 }),
        ],
      })
    );
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'OrderConfirmation', params: { orderId: 'ord-123' } }],
    });
  });

  it('does not place an order if no address is selected, even if the button is tapped', async () => {
    mockCheckout({ selectedPaymentMethodId: 'pay-upi', selectedAddress: null });
    await renderScreen(<CheckoutPaymentScreen />);
    const button = await screen.findByRole('button', { name: /Place Order/ });
    fireEvent.press(button);

    await waitFor(() => expect(OrderRepository.placeOrder).not.toHaveBeenCalled());
  });

  describe('order placement failure and cancellation', () => {
    it('hides the back button while the order is being placed, so it cannot be cancelled mid-flight', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-upi' });
      let resolvePlaceOrder: (order: { id: string }) => void = () => {};
      (OrderRepository.placeOrder as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePlaceOrder = resolve;
          })
      );

      await renderScreen(<CheckoutPaymentScreen />);
      expect(await screen.findByLabelText('Go back')).toBeTruthy();

      const button = await screen.findByRole('button', { name: /Place Order/ });
      fireEvent.press(button); // placeOrder never resolves yet, so don't await this press

      await waitFor(() => expect(screen.queryByLabelText('Go back')).toBeNull());

      resolvePlaceOrder({ id: 'ord-123' });
      await waitFor(() => expect(mockReset).toHaveBeenCalled());
    });

    it('shows an error and does not navigate or clear the cart when placing the order fails', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-upi' });
      const clearCart = jest.fn();
      mockCart({ clearCart });
      (OrderRepository.placeOrder as jest.Mock).mockRejectedValueOnce(new Error('network down'));

      await renderScreen(<CheckoutPaymentScreen />);
      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));

      expect(
        await screen.findByText('Payment could not be processed. Please try again.')
      ).toBeTruthy();
      expect(clearCart).not.toHaveBeenCalled();
      expect(mockReset).not.toHaveBeenCalled();
      expect(await screen.findByLabelText('Go back')).toBeTruthy();
    });

    it('clears the error and succeeds on a retry after a failed attempt', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-upi' });
      (OrderRepository.placeOrder as jest.Mock)
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce({ id: 'ord-123' });

      await renderScreen(<CheckoutPaymentScreen />);
      const button = await screen.findByRole('button', { name: /Place Order/ });
      await fireEvent.press(button);
      await screen.findByText('Payment could not be processed. Please try again.');

      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));

      await waitFor(() => expect(mockReset).toHaveBeenCalled());
      expect(screen.queryByText('Payment could not be processed. Please try again.')).toBeNull();
    });
  });

  describe('card payment validation', () => {
    it('blocks the order and shows errors when the card fields are left empty', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-card' });
      await renderScreen(<CheckoutPaymentScreen />);
      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));

      expect(await screen.findByText('Enter a valid card number')).toBeTruthy();
      expect(await screen.findByText('Enter a valid expiry (MM/YY)')).toBeTruthy();
      expect(await screen.findByText('Enter a valid CVV')).toBeTruthy();
      expect(OrderRepository.placeOrder).not.toHaveBeenCalled();
    });

    it('blocks the order and shows a card-expired error for a past expiry date', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-card' });
      await renderScreen(<CheckoutPaymentScreen />);
      await fireEvent.changeText(
        await screen.findByPlaceholderText('Card Number'),
        '4111111111111111'
      );
      await fireEvent.changeText(screen.getByPlaceholderText('MM/YY'), '01/20');
      await fireEvent.changeText(screen.getByPlaceholderText('CVV'), '123');

      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));

      expect(await screen.findByText('This card has expired')).toBeTruthy();
      expect(OrderRepository.placeOrder).not.toHaveBeenCalled();
    });

    it('places the order once valid card details are entered', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-card' });
      (OrderRepository.placeOrder as jest.Mock).mockResolvedValue({ id: 'ord-123' });
      await renderScreen(<CheckoutPaymentScreen />);
      await fireEvent.changeText(
        await screen.findByPlaceholderText('Card Number'),
        '4111111111111111'
      );
      await fireEvent.changeText(screen.getByPlaceholderText('MM/YY'), '12/99');
      await fireEvent.changeText(screen.getByPlaceholderText('CVV'), '123');

      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));

      await waitFor(() => expect(OrderRepository.placeOrder).toHaveBeenCalledTimes(1));
      expect(OrderRepository.placeOrder).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'Credit / Debit Card' })
      );
    });

    it('clears a field error as soon as that field is edited again', async () => {
      mockCheckout({ selectedPaymentMethodId: 'pay-card' });
      await renderScreen(<CheckoutPaymentScreen />);
      await fireEvent.press(await screen.findByRole('button', { name: /Place Order/ }));
      expect(await screen.findByText('Enter a valid card number')).toBeTruthy();

      await fireEvent.changeText(screen.getByPlaceholderText('Card Number'), '4111111111111111');

      await waitFor(() => expect(screen.queryByText('Enter a valid card number')).toBeNull());
    });
  });
});

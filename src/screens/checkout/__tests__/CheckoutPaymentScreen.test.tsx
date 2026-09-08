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
});

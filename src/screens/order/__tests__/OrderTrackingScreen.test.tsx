import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { OrderTrackingScreen } from '../OrderTrackingScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { OrderRepository } from '../../../repositories/OrderRepository';
import { Order } from '../../../types';

jest.mock('../../../repositories/OrderRepository', () => ({
  OrderRepository: { getById: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { orderId: 'ord-1' } }),
}));

const ORDER: Order = {
  id: 'ord-1',
  orderNumber: 'OJA1',
  date: '2026-01-01',
  status: 'shipped',
  items: [
    {
      productId: 'p1',
      variantId: 'v1',
      name: 'Ashwagandha',
      image: 'https://example.com/a.png',
      variantLabel: '100g',
      quantity: 2,
      price: 100,
    },
  ],
  subtotal: 200,
  discount: 0,
  deliveryFee: 0,
  total: 200,
  address: {
    id: 'a1',
    label: 'Home',
    fullName: 'Test User',
    phone: '9999999999',
    line1: '123 Test St',
    city: 'Bengaluru',
    state: 'KA',
    pincode: '560001',
  },
  paymentMethod: 'UPI',
  timeline: [],
  deliveryEstimate: 'Arriving in 2 days',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OrderTrackingScreen', () => {
  it('shows order summary, address, and items once loaded', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(ORDER);
    await renderScreen(<OrderTrackingScreen />);

    expect(OrderRepository.getById).toHaveBeenCalledWith('ord-1');
    expect(await screen.findByText('#OJA1')).toBeTruthy();
    expect(await screen.findByText('Arriving in 2 days')).toBeTruthy();
    expect(await screen.findByText(/Delivering to: 123 Test St/)).toBeTruthy();
    expect(await screen.findByText('Payment: UPI')).toBeTruthy();
    expect(await screen.findByText('Ashwagandha')).toBeTruthy();
    expect(await screen.findByText('₹200')).toBeTruthy();
  });

  it('shows an error state with retry when the order fails to load', async () => {
    (OrderRepository.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(ORDER);

    await renderScreen(<OrderTrackingScreen />);
    fireEvent.press(await screen.findByText('Try Again'));

    await screen.findByText('#OJA1');
    expect(OrderRepository.getById).toHaveBeenCalledTimes(2);
  });

  it('shows an error state when the order is not found', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(undefined);
    await renderScreen(<OrderTrackingScreen />);

    expect(await screen.findByText('Unable to load order')).toBeTruthy();
  });
});

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OrderConfirmationScreen } from '../OrderConfirmationScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { OrderRepository } from '../../../repositories/OrderRepository';
import { Order } from '../../../types';

jest.mock('../../../repositories/OrderRepository', () => ({
  OrderRepository: { getById: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { orderId: 'ord-1' } }),
}));

const ORDER: Order = {
  id: 'ord-1',
  orderNumber: 'OJA1',
  date: '2026-01-01',
  status: 'placed',
  items: [],
  subtotal: 300,
  discount: 0,
  deliveryFee: 0,
  total: 300,
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
  deliveryEstimate: 'Arriving in 4-6 days',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OrderConfirmationScreen', () => {
  it('shows the order details once loaded', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(ORDER);
    await renderScreen(<OrderConfirmationScreen />);

    expect(await screen.findByText('#OJA1')).toBeTruthy();
    expect(await screen.findByText('₹300')).toBeTruthy();
    expect(await screen.findByText('UPI')).toBeTruthy();
    expect(await screen.findByText('Arriving in 4-6 days')).toBeTruthy();
    expect(OrderRepository.getById).toHaveBeenCalledWith('ord-1');
  });

  it('shows an error state when the order cannot be found', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(undefined);
    await renderScreen(<OrderConfirmationScreen />);

    expect(await screen.findByText('Order not found')).toBeTruthy();
  });

  it('navigates to OrderTracking with the order id when Track Order is pressed', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(ORDER);
    await renderScreen(<OrderConfirmationScreen />);

    const trackButton = await screen.findByRole('button', { name: 'Track Order' });
    fireEvent.press(trackButton);

    expect(mockNavigate).toHaveBeenCalledWith('OrderTracking', { orderId: 'ord-1' });
  });

  it('navigates back to the Home tab when Continue Shopping is pressed', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(ORDER);
    await renderScreen(<OrderConfirmationScreen />);

    const continueButton = await screen.findByRole('button', { name: 'Continue Shopping' });
    fireEvent.press(continueButton);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'HomeTab' }));
  });
});

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OrderDetailsScreen } from '../OrderDetailsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { OrderRepository } from '../../../repositories/OrderRepository';
import { useCart } from '../../../context/CartContext';
import { Order } from '../../../types';

jest.mock('../../../repositories/OrderRepository', () => ({
  OrderRepository: {
    getById: jest.fn(),
    cancelOrder: jest.fn(),
    reorder: jest.fn(),
  },
}));
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { orderId: 'ord-1' } }),
}));

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    orderNumber: 'OJA1',
    date: '2026-01-01',
    status: 'placed',
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
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useCart as jest.Mock).mockReturnValue({ addToCart: jest.fn() });
});

describe('OrderDetailsScreen', () => {
  it('shows Track Order and Cancel Order for a freshly placed order', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(makeOrder({ status: 'placed' }));
    await renderScreen(<OrderDetailsScreen />);

    expect(await screen.findByRole('button', { name: 'Track Order' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Cancel Order' })).toBeTruthy();
  });

  it('hides Track Order and Cancel Order for a delivered order', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(makeOrder({ status: 'delivered' }));
    await renderScreen(<OrderDetailsScreen />);

    await screen.findByRole('button', { name: 'Reorder' });
    expect(screen.queryByRole('button', { name: 'Track Order' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel Order' })).toBeNull();
  });

  it('cancels the order after confirming, and reflects the new status', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(makeOrder({ status: 'placed' }));
    (OrderRepository.cancelOrder as jest.Mock).mockResolvedValue(
      makeOrder({ status: 'cancelled' })
    );

    await renderScreen(<OrderDetailsScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Cancel Order' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Yes, Cancel' }));

    await waitFor(() => expect(OrderRepository.cancelOrder).toHaveBeenCalledWith('ord-1'));
    expect(await screen.findByText('Cancelled')).toBeTruthy();
  });

  it('reorders by adding every item back to the cart', async () => {
    (OrderRepository.getById as jest.Mock).mockResolvedValue(makeOrder());
    (OrderRepository.reorder as jest.Mock).mockResolvedValue([
      { productId: 'p1', variantId: 'v1', quantity: 2 },
    ]);
    const addToCart = jest.fn();
    (useCart as jest.Mock).mockReturnValue({ addToCart });

    await renderScreen(<OrderDetailsScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Reorder' }));

    await waitFor(() => expect(addToCart).toHaveBeenCalledWith('p1', 'v1', 2));
  });

  it('shows an error state with retry when the order fails to load', async () => {
    (OrderRepository.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(makeOrder());

    await renderScreen(<OrderDetailsScreen />);
    const retryButton = await screen.findByText('Try Again');
    fireEvent.press(retryButton);

    await screen.findByText('#OJA1');
    expect(OrderRepository.getById).toHaveBeenCalledTimes(2);
  });
});

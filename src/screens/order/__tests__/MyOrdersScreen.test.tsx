import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MyOrdersScreen } from '../MyOrdersScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { OrderRepository } from '../../../repositories/OrderRepository';
import { useCart } from '../../../context/CartContext';
import { Order } from '../../../types';

jest.mock('../../../repositories/OrderRepository', () => ({
  OrderRepository: {
    getByStatusGroup: jest.fn(),
    reorder: jest.fn(),
  },
}));
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockNavigate = jest.fn();
let mockRouteParams: { initialTab?: string } | undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
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
        quantity: 1,
        price: 200,
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
  mockRouteParams = undefined;
  (useCart as jest.Mock).mockReturnValue({ addToCart: jest.fn() });
});

describe('MyOrdersScreen', () => {
  it('loads the "all" tab by default', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([makeOrder()]);
    await renderScreen(<MyOrdersScreen />);

    await waitFor(() => expect(OrderRepository.getByStatusGroup).toHaveBeenCalledWith('all'));
  });

  it('respects an initialTab passed via route params', async () => {
    mockRouteParams = { initialTab: 'ongoing' };
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([]);
    await renderScreen(<MyOrdersScreen />);

    await waitFor(() => expect(OrderRepository.getByStatusGroup).toHaveBeenCalledWith('ongoing'));
  });

  it('reloads orders for the tapped tab', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([makeOrder()]);
    await renderScreen(<MyOrdersScreen />);
    await waitFor(() => expect(OrderRepository.getByStatusGroup).toHaveBeenCalledWith('all'));

    fireEvent.press(await screen.findByText('Delivered'));

    await waitFor(() => expect(OrderRepository.getByStatusGroup).toHaveBeenCalledWith('delivered'));
  });

  it('shows a tab-specific empty state when there are no orders', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([]);
    await renderScreen(<MyOrdersScreen />);

    expect(await screen.findByText('No orders yet')).toBeTruthy();
  });

  it('shows an error state with retry on failure', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce([makeOrder()]);

    await renderScreen(<MyOrdersScreen />);
    fireEvent.press(await screen.findByText('Try Again'));

    await screen.findByText('#OJA1');
    expect(OrderRepository.getByStatusGroup).toHaveBeenCalledTimes(2);
  });

  it('navigates to OrderDetails when an order card is pressed', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([makeOrder()]);
    await renderScreen(<MyOrdersScreen />);

    fireEvent.press(await screen.findByText('#OJA1'));
    expect(mockNavigate).toHaveBeenCalledWith('OrderDetails', { orderId: 'ord-1' });
  });

  it('shows Track Order only for non-final statuses, and navigates on press', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([
      makeOrder({ status: 'placed' }),
    ]);
    await renderScreen(<MyOrdersScreen />);

    const trackButton = await screen.findByRole('button', { name: 'Track Order' });
    fireEvent.press(trackButton);
    expect(mockNavigate).toHaveBeenCalledWith('OrderTracking', { orderId: 'ord-1' });
  });

  it('hides Track Order for a delivered order', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([
      makeOrder({ status: 'delivered' }),
    ]);
    await renderScreen(<MyOrdersScreen />);

    await screen.findByText('#OJA1');
    expect(screen.queryByRole('button', { name: 'Track Order' })).toBeNull();
  });

  it('reorders by adding every item back to the cart', async () => {
    (OrderRepository.getByStatusGroup as jest.Mock).mockResolvedValue([makeOrder()]);
    (OrderRepository.reorder as jest.Mock).mockResolvedValue([
      { productId: 'p1', variantId: 'v1', quantity: 3 },
    ]);
    const addToCart = jest.fn();
    (useCart as jest.Mock).mockReturnValue({ addToCart });

    await renderScreen(<MyOrdersScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'Reorder' }));

    await waitFor(() => expect(addToCart).toHaveBeenCalledWith('p1', 'v1', 3));
  });
});

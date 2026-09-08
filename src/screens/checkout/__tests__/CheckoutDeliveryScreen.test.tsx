import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { CheckoutDeliveryScreen } from '../CheckoutDeliveryScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useCheckout } from '../../../context/CheckoutContext';
import { useCart } from '../../../context/CartContext';
import { deliveryOptions } from '../../../data/checkoutOptions';

jest.mock('../../../context/CheckoutContext', () => ({
  useCheckout: jest.fn(),
}));
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

function mockCheckout(overrides: Partial<ReturnType<typeof useCheckout>> = {}) {
  (useCheckout as jest.Mock).mockReturnValue({
    selectedDelivery: deliveryOptions[0],
    setSelectedDelivery: jest.fn(),
    ...overrides,
  });
}

function mockCart(subtotal: number) {
  (useCart as jest.Mock).mockReturnValue({ subtotal });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckout();
});

describe('CheckoutDeliveryScreen', () => {
  it('shows the free-delivery note when the subtotal already qualifies', async () => {
    mockCart(600);
    await renderScreen(<CheckoutDeliveryScreen />);
    expect(
      await screen.findByText('Your order qualifies for free standard delivery.')
    ).toBeTruthy();
  });

  it('shows how much more is needed when the subtotal does not qualify', async () => {
    mockCart(400);
    await renderScreen(<CheckoutDeliveryScreen />);
    expect(await screen.findByText(/Add items worth ₹99 more/)).toBeTruthy();
  });

  it('selecting a delivery option calls setSelectedDelivery with that option', async () => {
    mockCart(600);
    const setSelectedDelivery = jest.fn();
    mockCheckout({ selectedDelivery: deliveryOptions[0], setSelectedDelivery });

    await renderScreen(<CheckoutDeliveryScreen />);
    const expressOption = await screen.findByText('Express Delivery');
    fireEvent.press(expressOption);

    expect(setSelectedDelivery).toHaveBeenCalledWith(deliveryOptions[1]);
  });

  it('shows the real price for a paid delivery option', async () => {
    mockCart(600);
    await renderScreen(<CheckoutDeliveryScreen />);
    expect(await screen.findByText('₹79')).toBeTruthy();
    expect(await screen.findByText('₹149')).toBeTruthy();
  });

  it('navigates to CheckoutPayment when Continue to Payment is pressed', async () => {
    mockCart(600);
    await renderScreen(<CheckoutDeliveryScreen />);
    const button = await screen.findByRole('button', { name: 'Continue to Payment' });
    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith('CheckoutPayment');
  });
});

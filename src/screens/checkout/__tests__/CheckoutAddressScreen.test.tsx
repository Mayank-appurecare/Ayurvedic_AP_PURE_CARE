import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckoutAddressScreen } from '../CheckoutAddressScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useCheckout } from '../../../context/CheckoutContext';
import { UserRepository } from '../../../repositories/UserRepository';
import { Address } from '../../../types';

jest.mock('../../../context/CheckoutContext', () => ({
  useCheckout: jest.fn(),
}));
jest.mock('../../../repositories/UserRepository', () => ({
  UserRepository: { getAddresses: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, []),
}));

function makeAddress(overrides: Partial<Address> & { id: string }): Address {
  return {
    label: 'Home',
    fullName: 'Test User',
    phone: '9999999999',
    line1: '123 Test St',
    city: 'Bengaluru',
    state: 'KA',
    pincode: '560001',
    ...overrides,
  };
}

const ADDR_DEFAULT = makeAddress({ id: 'a1', label: 'Home', isDefault: true });
const ADDR_OTHER = makeAddress({ id: 'a2', label: 'Office' });

function mockCheckout(overrides: Partial<ReturnType<typeof useCheckout>> = {}) {
  (useCheckout as jest.Mock).mockReturnValue({
    selectedAddress: null,
    setSelectedAddress: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckout();
});

describe('CheckoutAddressScreen', () => {
  it('auto-selects the default address once addresses load', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([ADDR_DEFAULT, ADDR_OTHER]);
    const setSelectedAddress = jest.fn();
    mockCheckout({ setSelectedAddress });

    await renderScreen(<CheckoutAddressScreen />);

    await waitFor(() => expect(setSelectedAddress).toHaveBeenCalledWith(ADDR_DEFAULT));
  });

  it('does not override an already-selected address', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([ADDR_DEFAULT, ADDR_OTHER]);
    const setSelectedAddress = jest.fn();
    mockCheckout({ selectedAddress: ADDR_OTHER, setSelectedAddress });

    await renderScreen(<CheckoutAddressScreen />);
    await screen.findByText('Office');

    expect(setSelectedAddress).not.toHaveBeenCalled();
  });

  it('shows an empty state when there are no saved addresses', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([]);
    await renderScreen(<CheckoutAddressScreen />);

    expect(await screen.findByText('No saved addresses')).toBeTruthy();
  });

  it('shows an error state with retry when loading addresses fails', async () => {
    (UserRepository.getAddresses as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([ADDR_DEFAULT]);

    await renderScreen(<CheckoutAddressScreen />);
    const retryButton = await screen.findByText('Try Again');
    fireEvent.press(retryButton);

    await screen.findByText('Home');
    expect(UserRepository.getAddresses).toHaveBeenCalledTimes(2);
  });

  it('disables "Deliver Here" until an address is selected, then navigates on press', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([ADDR_DEFAULT]);
    mockCheckout({ selectedAddress: ADDR_DEFAULT });

    await renderScreen(<CheckoutAddressScreen />);
    const button = await screen.findByRole('button', { name: 'Deliver Here' });
    expect(button.props.accessibilityState?.disabled).toBeFalsy();

    fireEvent.press(button);
    expect(mockNavigate).toHaveBeenCalledWith('CheckoutDelivery');
  });

  it('keeps "Deliver Here" disabled when no address is selected', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([ADDR_DEFAULT, ADDR_OTHER]);
    mockCheckout({ selectedAddress: null });

    await renderScreen(<CheckoutAddressScreen />);
    const button = await screen.findByRole('button', { name: 'Deliver Here' });
    expect(button.props.accessibilityState?.disabled).toBeTruthy();
  });
});

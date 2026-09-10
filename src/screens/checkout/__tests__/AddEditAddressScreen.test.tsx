import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AddEditAddressScreen } from '../AddEditAddressScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { UserRepository } from '../../../repositories/UserRepository';
import { Address } from '../../../types';

jest.mock('../../../repositories/UserRepository', () => ({
  UserRepository: {
    getAddresses: jest.fn(),
    addAddress: jest.fn(),
    updateAddress: jest.fn(),
  },
}));

const mockGoBack = jest.fn();
let mockRouteParams: { addressId?: string } | undefined;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

function makeAddress(overrides: Partial<Address> & { id: string }): Address {
  return {
    label: 'Home',
    fullName: 'Existing User',
    phone: '9876543210',
    line1: '42 Old Street',
    city: 'Bengaluru',
    state: 'KA',
    pincode: '560001',
    ...overrides,
  };
}

async function fillValidForm() {
  fireEvent.changeText(await screen.findByLabelText('Full Name'), '  Jane Doe  ');
  fireEvent.changeText(await screen.findByLabelText('Phone Number'), '9123456780');
  fireEvent.changeText(await screen.findByLabelText('Address Line 1'), '  221B Baker Street  ');
  fireEvent.changeText(await screen.findByLabelText('City'), '  Mumbai  ');
  await selectState('Maharashtra');
  fireEvent.changeText(await screen.findByLabelText('Pincode'), '400001');
}

async function selectState(state: string) {
  fireEvent.press(await screen.findByLabelText('State'));
  fireEvent.press(await screen.findByText(state));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = undefined;
});

describe('AddEditAddressScreen', () => {
  it('renders an empty Add New Address form when there is no addressId', async () => {
    await renderScreen(<AddEditAddressScreen />);

    expect(await screen.findByText('Add New Address')).toBeTruthy();
    expect((await screen.findByLabelText('Full Name')).props.value).toBe('');
    expect(UserRepository.getAddresses).not.toHaveBeenCalled();
  });

  it('loads and pre-fills the existing address when editing', async () => {
    mockRouteParams = { addressId: 'a1' };
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      makeAddress({ id: 'a1', label: 'Office', isDefault: true }),
      makeAddress({ id: 'a2' }),
    ]);

    await renderScreen(<AddEditAddressScreen />);

    expect(await screen.findByText('Edit Address')).toBeTruthy();
    expect((await screen.findByLabelText('Full Name')).props.value).toBe('Existing User');
    expect((await screen.findByLabelText('Pincode')).props.value).toBe('560001');
  });

  it('blocks save and shows validation errors when required fields are empty', async () => {
    await renderScreen(<AddEditAddressScreen />);

    fireEvent.press(await screen.findByRole('button', { name: 'Save Address' }));

    expect(await screen.findByText('Full name is required')).toBeTruthy();
    expect(await screen.findByText('Address line 1 is required')).toBeTruthy();
    expect(await screen.findByText('City is required')).toBeTruthy();
    expect(await screen.findByText('State is required')).toBeTruthy();
    expect(UserRepository.addAddress).not.toHaveBeenCalled();
  });

  it('blocks 0-6 as the leading digit of the phone number, but accepts 7-9 with any digits after', async () => {
    await renderScreen(<AddEditAddressScreen />);

    for (const digit of ['0', '1', '2', '3', '4', '5', '6']) {
      await fireEvent.changeText(await screen.findByLabelText('Phone Number'), `${digit}234567890`);
      expect((await screen.findByLabelText('Phone Number')).props.value).toBe('');
    }

    for (const digit of ['7', '8', '9']) {
      await fireEvent.changeText(await screen.findByLabelText('Phone Number'), `${digit}234567890`);
      expect((await screen.findByLabelText('Phone Number')).props.value).toBe(`${digit}234567890`);
      await fireEvent.changeText(await screen.findByLabelText('Phone Number'), '');
    }
  });

  it('caps the phone number field at 10 digits', async () => {
    await renderScreen(<AddEditAddressScreen />);

    expect((await screen.findByLabelText('Phone Number')).props.maxLength).toBe(10);
  });

  describe('State picker', () => {
    it('shows a placeholder until a state is picked, then displays the chosen state', async () => {
      await renderScreen(<AddEditAddressScreen />);

      expect(await screen.findByText('Select State')).toBeTruthy();

      await selectState('Karnataka');

      expect(await screen.findByText('Karnataka')).toBeTruthy();
      expect(screen.queryByText('Select State')).toBeNull();
    });

    it('filters the list down to states matching the search text', async () => {
      await renderScreen(<AddEditAddressScreen />);

      fireEvent.press(await screen.findByLabelText('State'));
      fireEvent.changeText(await screen.findByLabelText('Search state'), 'kera');

      expect(await screen.findByText('Kerala')).toBeTruthy();
      expect(screen.queryByText('Karnataka')).toBeNull();
      expect(screen.queryByText('Punjab')).toBeNull();
    });
  });

  it('rejects an invalid pincode without saving', async () => {
    await renderScreen(<AddEditAddressScreen />);
    await fillValidForm();
    fireEvent.changeText(await screen.findByLabelText('Pincode'), '12');

    fireEvent.press(await screen.findByRole('button', { name: 'Save Address' }));

    expect(await screen.findByText('Enter a valid 6-digit pincode')).toBeTruthy();
    expect(UserRepository.addAddress).not.toHaveBeenCalled();
  });

  it('saves a new address with a trimmed payload and navigates back', async () => {
    (UserRepository.addAddress as jest.Mock).mockResolvedValue({});
    await renderScreen(<AddEditAddressScreen />);
    await fillValidForm();
    fireEvent.press(await screen.findByText('Office'));

    fireEvent.press(await screen.findByRole('button', { name: 'Save Address' }));

    await waitFor(() =>
      expect(UserRepository.addAddress).toHaveBeenCalledWith({
        label: 'Office',
        fullName: 'Jane Doe',
        phone: '9123456780',
        line1: '221B Baker Street',
        line2: undefined,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isDefault: false,
      })
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('updates an existing address, preserving its default flag, and navigates back', async () => {
    mockRouteParams = { addressId: 'a1' };
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      makeAddress({ id: 'a1', isDefault: true }),
    ]);
    (UserRepository.updateAddress as jest.Mock).mockResolvedValue({});

    await renderScreen(<AddEditAddressScreen />);
    await screen.findByText('Edit Address');
    fireEvent.changeText(await screen.findByLabelText('City'), 'Pune');

    fireEvent.press(await screen.findByRole('button', { name: 'Save Address' }));

    await waitFor(() =>
      expect(UserRepository.updateAddress).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1', city: 'Pune', isDefault: true })
      )
    );
    expect(mockGoBack).toHaveBeenCalled();
  });
});

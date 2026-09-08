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
  fireEvent.changeText(await screen.findByLabelText('State'), '  MH  ');
  fireEvent.changeText(await screen.findByLabelText('Pincode'), '400001');
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
        state: 'MH',
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

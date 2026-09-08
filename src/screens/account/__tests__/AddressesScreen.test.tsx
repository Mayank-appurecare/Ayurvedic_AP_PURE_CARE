import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AddressesScreen } from '../AddressesScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { UserRepository } from '../../../repositories/UserRepository';
import { anAddress } from '../../../test-utils/fixtures';

jest.mock('../../../repositories/UserRepository', () => ({
  UserRepository: { getAddresses: jest.fn(), deleteAddress: jest.fn() },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over top-level imports
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, []),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddressesScreen', () => {
  it('shows the loading state while addresses load', async () => {
    (UserRepository.getAddresses as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<AddressesScreen />);

    expect(await screen.findByText('Loading addresses...')).toBeTruthy();
  });

  it('shows an error state with retry when loading addresses fails', async () => {
    (UserRepository.getAddresses as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([anAddress({ id: 'a1', fullName: 'Jane Doe' })]);

    await renderScreen(<AddressesScreen />);
    fireEvent.press(await screen.findByText('Try Again'));

    await screen.findByText('Jane Doe');
    expect(UserRepository.getAddresses).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state and navigates to AddEditAddress when its action is pressed', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([]);
    await renderScreen(<AddressesScreen />);

    expect(await screen.findByText('No addresses saved')).toBeTruthy();
    fireEvent.press(await screen.findByRole('button', { name: 'Add New Address' }));

    expect(mockNavigate).toHaveBeenCalledWith('AddEditAddress');
  });

  it('renders a card for each saved address', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      anAddress({ id: 'a1', label: 'Home', fullName: 'Jane Doe' }),
      anAddress({ id: 'a2', label: 'Office', fullName: 'John Smith' }),
    ]);
    await renderScreen(<AddressesScreen />);

    expect(await screen.findByText('Jane Doe')).toBeTruthy();
    expect(await screen.findByText('John Smith')).toBeTruthy();
  });

  it('navigates to AddEditAddress with the address id when editing', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      anAddress({ id: 'a1', fullName: 'Jane Doe' }),
    ]);
    await renderScreen(<AddressesScreen />);

    fireEvent.press(await screen.findByText('Edit'));

    expect(mockNavigate).toHaveBeenCalledWith('AddEditAddress', { addressId: 'a1' });
  });

  it('navigates to AddEditAddress with no params from the footer "Add New Address" button', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      anAddress({ id: 'a1', fullName: 'Jane Doe' }),
    ]);
    await renderScreen(<AddressesScreen />);

    fireEvent.press(await screen.findByRole('button', { name: '+ Add New Address' }));

    expect(mockNavigate).toHaveBeenCalledWith('AddEditAddress');
  });

  it('opens a confirmation dialog before deleting an address, and deletes on confirm', async () => {
    (UserRepository.getAddresses as jest.Mock)
      .mockResolvedValueOnce([anAddress({ id: 'a1', fullName: 'Jane Doe' })])
      .mockResolvedValueOnce([]);
    (UserRepository.deleteAddress as jest.Mock).mockResolvedValue(undefined);

    await renderScreen(<AddressesScreen />);
    fireEvent.press(await screen.findByText('Delete'));

    expect(await screen.findByText('Delete Address')).toBeTruthy();
    expect(await screen.findByText('Are you sure you want to remove this address?')).toBeTruthy();

    // The address card's own "Delete" trigger stays mounted behind the modal,
    // so both its label and the dialog's "Delete" confirm button label match
    // this text query — the dialog's is the one added later, at the end of
    // the array. (findByRole can't disambiguate these: AddressCard's button
    // also contains an Ionicons glyph character, which findByRole includes
    // in the computed accessible name but findByText does not, since it
    // matches this specific "Delete" text node only.)
    const deleteButtons = await screen.findAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
    fireEvent.press(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(UserRepository.deleteAddress).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(UserRepository.getAddresses).toHaveBeenCalledTimes(2));
  });

  it('cancelling the delete confirmation leaves the address in place', async () => {
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      anAddress({ id: 'a1', fullName: 'Jane Doe' }),
    ]);
    await renderScreen(<AddressesScreen />);

    fireEvent.press(await screen.findByText('Delete'));
    expect(await screen.findByText('Delete Address')).toBeTruthy();
    fireEvent.press(await screen.findByRole('button', { name: 'Cancel' }));

    expect(UserRepository.deleteAddress).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Delete Address')).toBeNull());
  });
});

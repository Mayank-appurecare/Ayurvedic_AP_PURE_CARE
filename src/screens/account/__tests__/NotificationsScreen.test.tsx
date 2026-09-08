import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { NotificationsScreen } from '../NotificationsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotificationsScreen', () => {
  it('renders the initial notifications, from first to last', async () => {
    await renderScreen(<NotificationsScreen />);

    expect(await screen.findByText('Your order #OJA10023841 is out for delivery')).toBeTruthy();
    expect(screen.getByText('2h ago')).toBeTruthy();
    expect(screen.getByText('The Golden Herb: Turmeric in Ayurveda is trending')).toBeTruthy();
  });

  it('navigates to MyOrders when an order notification is pressed', async () => {
    await renderScreen(<NotificationsScreen />);

    fireEvent.press(await screen.findByText('Your order #OJA10023841 is out for delivery'));

    expect(mockNavigate).toHaveBeenCalledWith('MyOrders');
  });

  it('navigates to Articles when a wellness notification is pressed', async () => {
    await renderScreen(<NotificationsScreen />);

    fireEvent.press(await screen.findByText('New article: Understanding Ashwagandha'));

    expect(mockNavigate).toHaveBeenCalledWith('Articles');
  });

  it('navigates to Offers when an offer notification is pressed', async () => {
    await renderScreen(<NotificationsScreen />);

    fireEvent.press(await screen.findByText('Flat ₹100 off — use APWELCOME on your next order'));

    expect(mockNavigate).toHaveBeenCalledWith('Offers');
  });
});

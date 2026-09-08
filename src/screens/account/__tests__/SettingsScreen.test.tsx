import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsScreen } from '../SettingsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Start every test with a clean, light-mode theme preference regardless of
  // what a previous test may have persisted into the AsyncStorage mock.
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

describe('SettingsScreen', () => {
  it('shows the default preference toggles', async () => {
    await renderScreen(<SettingsScreen />);

    expect((await screen.findByLabelText('Push Notifications')).props.value).toBe(true);
    expect((await screen.findByLabelText('Order Updates via SMS')).props.value).toBe(true);
    expect((await screen.findByLabelText('Promotional Emails')).props.value).toBe(false);
    expect((await screen.findByLabelText('Dark Mode')).props.value).toBe(false);
    expect(await screen.findByText('Light theme is on')).toBeTruthy();
  });

  it('toggles push notifications off', async () => {
    await renderScreen(<SettingsScreen />);

    const toggle = await screen.findByLabelText('Push Notifications');
    fireEvent(toggle, 'valueChange', false);

    expect((await screen.findByLabelText('Push Notifications')).props.value).toBe(false);
  });

  it('toggles SMS order updates off', async () => {
    await renderScreen(<SettingsScreen />);

    const toggle = await screen.findByLabelText('Order Updates via SMS');
    fireEvent(toggle, 'valueChange', false);

    expect((await screen.findByLabelText('Order Updates via SMS')).props.value).toBe(false);
  });

  it('toggles promotional emails on', async () => {
    await renderScreen(<SettingsScreen />);

    const toggle = await screen.findByLabelText('Promotional Emails');
    fireEvent(toggle, 'valueChange', true);

    expect((await screen.findByLabelText('Promotional Emails')).props.value).toBe(true);
  });

  it('toggling Dark Mode flips the theme and persists the preference', async () => {
    await renderScreen(<SettingsScreen />);

    const toggle = await screen.findByLabelText('Dark Mode');
    fireEvent(toggle, 'valueChange', true);

    expect(await screen.findByText('Dark theme is on')).toBeTruthy();
    expect((await screen.findByLabelText('Dark Mode')).props.value).toBe(true);
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@ojas_ayurveda/theme_preference', 'dark')
    );
  });

  it('shows the app version', async () => {
    await renderScreen(<SettingsScreen />);

    expect(await screen.findByText('App Version')).toBeTruthy();
    expect(await screen.findByText('1.0.0')).toBeTruthy();
  });

  it('shows placeholder Terms & Conditions copy when pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<SettingsScreen />);

    fireEvent.press(await screen.findByText('Terms & Conditions'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Terms & Conditions',
      'This is placeholder legal copy for the AP Pure Care demo app. In a production build, this would contain the full text.'
    );
    alertSpy.mockRestore();
  });

  it('shows placeholder Privacy Policy copy when pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<SettingsScreen />);

    fireEvent.press(await screen.findByText('Privacy Policy'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Privacy Policy',
      'This is placeholder legal copy for the AP Pure Care demo app. In a production build, this would contain the full text.'
    );
    alertSpy.mockRestore();
  });

  it('navigates back when the back button is pressed', async () => {
    await renderScreen(<SettingsScreen />);
    fireEvent.press(await screen.findByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

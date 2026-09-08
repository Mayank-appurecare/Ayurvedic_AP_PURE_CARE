import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { HelpSupportScreen } from '../HelpSupportScreen';
import { renderScreen } from '../../../test-utils/renderScreen';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

let openURLSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(() => {
  openURLSpy.mockRestore();
});

describe('HelpSupportScreen', () => {
  it('renders the contact options and FAQ questions, with answers collapsed', async () => {
    await renderScreen(<HelpSupportScreen />);

    expect(await screen.findByText('Chat with us')).toBeTruthy();
    expect(screen.getByText('Call Support: 1800-XXX-XXXX')).toBeTruthy();
    expect(screen.getByText('Email: support@appurecare.example')).toBeTruthy();
    expect(screen.getByText('How long does delivery usually take?')).toBeTruthy();
    expect(screen.queryByText(/Standard delivery takes 4-6 business days/)).toBeNull();
  });

  it('does not open a link when "Chat with us" is pressed', async () => {
    await renderScreen(<HelpSupportScreen />);
    fireEvent.press(await screen.findByText('Chat with us'));

    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('opens the phone dialer when Call Support is pressed', async () => {
    await renderScreen(<HelpSupportScreen />);
    fireEvent.press(await screen.findByText('Call Support: 1800-XXX-XXXX'));

    expect(openURLSpy).toHaveBeenCalledWith('tel:1800999999');
  });

  it('opens the mail client when Email is pressed', async () => {
    await renderScreen(<HelpSupportScreen />);
    fireEvent.press(await screen.findByText('Email: support@appurecare.example'));

    expect(openURLSpy).toHaveBeenCalledWith('mailto:support@appurecare.example');
  });

  it('expands a FAQ answer on press, and collapses it again on a second press', async () => {
    await renderScreen(<HelpSupportScreen />);
    const question = await screen.findByText('How long does delivery usually take?');

    fireEvent.press(question);
    expect(await screen.findByText(/Standard delivery takes 4-6 business days/)).toBeTruthy();

    fireEvent.press(question);
    await waitFor(() =>
      expect(screen.queryByText(/Standard delivery takes 4-6 business days/)).toBeNull()
    );
  });

  it('collapses the previously expanded FAQ when a different question is pressed', async () => {
    await renderScreen(<HelpSupportScreen />);
    fireEvent.press(await screen.findByText('How long does delivery usually take?'));
    expect(await screen.findByText(/Standard delivery takes 4-6 business days/)).toBeTruthy();

    fireEvent.press(await screen.findByText('What is your return policy?'));

    expect(await screen.findByText(/Unopened products can be returned within 7 days/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText(/Standard delivery takes 4-6 business days/)).toBeNull()
    );
  });
});

import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from '../OnboardingScreen';
import { renderScreen } from '../../../test-utils/renderScreen';

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OnboardingScreen', () => {
  it('completing Skip persists onboarding as done and navigates to Welcome', async () => {
    await renderScreen(<OnboardingScreen />);
    fireEvent.press(await screen.findByLabelText('Skip onboarding'));

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@ojas_ayurveda/onboarding_complete',
        'true'
      )
    );
    expect(mockReplace).toHaveBeenCalledWith('Welcome');
  });

  it('shows "Next" on the first slide and switches to "Get Started" on the last one', async () => {
    await renderScreen(<OnboardingScreen />);
    expect(await screen.findByRole('button', { name: 'Next' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Get Started' })).toBeNull();

    const list = screen.getByTestId('onboarding-carousel');
    await act(() => list.props.onViewableItemsChanged({ viewableItems: [{ index: 2 }] }));

    expect(await screen.findByRole('button', { name: 'Get Started' })).toBeTruthy();
  });

  it('pressing "Get Started" on the last slide also finishes onboarding', async () => {
    await renderScreen(<OnboardingScreen />);
    const list = screen.getByTestId('onboarding-carousel');
    await act(() => list.props.onViewableItemsChanged({ viewableItems: [{ index: 2 }] }));

    fireEvent.press(await screen.findByRole('button', { name: 'Get Started' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('Welcome'));
  });
});

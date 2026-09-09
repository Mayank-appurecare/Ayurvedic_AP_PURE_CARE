import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { ReviewCard } from '../ReviewCard';
import { renderScreen } from '../../test-utils/renderScreen';
import { aReview } from '../../test-utils/fixtures';

const REVIEW = aReview({ id: 'r1', helpfulCount: 24 });

describe('ReviewCard', () => {
  it('renders the customer name, text, and starting helpful count', async () => {
    await renderScreen(<ReviewCard review={REVIEW} />);

    expect(await screen.findByText('Priya Sharma')).toBeTruthy();
    expect(screen.getByText(REVIEW.text)).toBeTruthy();
    expect(screen.getByText('Helpful (24)')).toBeTruthy();
  });

  it('pressing Helpful increases the count by one and reports the vote', async () => {
    const onHelpful = jest.fn();
    await renderScreen(<ReviewCard review={REVIEW} onHelpful={onHelpful} />);

    fireEvent.press(await screen.findByText('Helpful (24)'));

    expect(await screen.findByText('Helpful (25)')).toBeTruthy();
    expect(onHelpful).toHaveBeenCalledWith('r1');
  });

  it('pressing Helpful again un-marks it, taking the count back down, with no second vote reported', async () => {
    const onHelpful = jest.fn();
    await renderScreen(<ReviewCard review={REVIEW} onHelpful={onHelpful} />);

    fireEvent.press(await screen.findByText('Helpful (24)'));
    await screen.findByText('Helpful (25)');
    fireEvent.press(screen.getByText('Helpful (25)'));

    expect(await screen.findByText('Helpful (24)')).toBeTruthy();
    expect(onHelpful).toHaveBeenCalledTimes(1);
  });

  it('marking it helpful a second time reports another vote', async () => {
    const onHelpful = jest.fn();
    await renderScreen(<ReviewCard review={REVIEW} onHelpful={onHelpful} />);

    fireEvent.press(await screen.findByText('Helpful (24)'));
    await screen.findByText('Helpful (25)');
    fireEvent.press(screen.getByText('Helpful (25)'));
    await screen.findByText('Helpful (24)');
    fireEvent.press(screen.getByText('Helpful (24)'));

    expect(await screen.findByText('Helpful (25)')).toBeTruthy();
    expect(onHelpful).toHaveBeenCalledTimes(2);
  });
});

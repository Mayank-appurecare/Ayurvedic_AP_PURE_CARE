import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { CouponCard } from '../CouponCard';
import { renderScreen } from '../../test-utils/renderScreen';
import { Coupon } from '../../types';

const COUPON: Coupon = {
  id: 'c1',
  code: 'SAVE10',
  description: 'Flat discount on your order',
  discountType: 'flat',
  discountValue: 10,
  expiryDate: '2026-12-31',
  isApplicable: true,
};

describe('CouponCard', () => {
  it('shows an Apply button by default, which calls onApply when pressed', async () => {
    const onApply = jest.fn();
    await renderScreen(<CouponCard coupon={COUPON} showApply onApply={onApply} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalled();
  });

  it('shows "Applied" instead of the Apply button once applied, with no confetti unless justApplied', async () => {
    await renderScreen(<CouponCard coupon={COUPON} showApply applied />);

    expect(await screen.findByText('Applied')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  });

  it('disables Apply for a coupon that is not applicable to the current cart', async () => {
    await renderScreen(
      <CouponCard coupon={{ ...COUPON, isApplicable: false }} showApply onApply={jest.fn()} />
    );

    const button = await screen.findByRole('button', { name: 'Apply' });
    expect(button.props.accessibilityState?.disabled).toBeTruthy();
    expect(await screen.findByText('Not applicable to current cart')).toBeTruthy();
  });

  it('hides the Apply/Applied control entirely when showApply is not set', async () => {
    await renderScreen(<CouponCard coupon={COUPON} />);

    expect(await screen.findByText('SAVE10')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
    expect(screen.queryByText('Applied')).toBeNull();
  });
});

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CheckoutProvider, useCheckout } from '../CheckoutContext';
import { deliveryOptions } from '../../data/checkoutOptions';
import { Address, Coupon } from '../../types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CheckoutProvider>{children}</CheckoutProvider>
);

const ADDRESS: Address = {
  id: 'addr-1',
  label: 'Home',
  fullName: 'Mayank Sharma',
  phone: '+91 98765 43210',
  line1: '123 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

const COUPON: Coupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  description: '10% off',
  discountType: 'percent',
  discountValue: 10,
  expiryDate: '2030-01-01',
};

describe('CheckoutContext', () => {
  it('starts with no address, the first delivery option, no coupon and no payment method', async () => {
    const { result } = await renderHook(() => useCheckout(), { wrapper });

    expect(result.current.selectedAddress).toBeNull();
    expect(result.current.selectedDelivery).toEqual(deliveryOptions[0]);
    expect(result.current.appliedCoupon).toBeNull();
    expect(result.current.selectedPaymentMethodId).toBeNull();
  });

  it('setSelectedAddress updates the selected address', async () => {
    const { result } = await renderHook(() => useCheckout(), { wrapper });

    await act(() => result.current.setSelectedAddress(ADDRESS));
    expect(result.current.selectedAddress).toEqual(ADDRESS);

    await act(() => result.current.setSelectedAddress(null));
    expect(result.current.selectedAddress).toBeNull();
  });

  it('setSelectedDelivery updates the selected delivery option', async () => {
    const { result } = await renderHook(() => useCheckout(), { wrapper });

    await act(() => result.current.setSelectedDelivery(deliveryOptions[1]));
    expect(result.current.selectedDelivery).toEqual(deliveryOptions[1]);
  });

  it('setAppliedCoupon updates the applied coupon', async () => {
    const { result } = await renderHook(() => useCheckout(), { wrapper });

    await act(() => result.current.setAppliedCoupon(COUPON));
    expect(result.current.appliedCoupon).toEqual(COUPON);

    await act(() => result.current.setAppliedCoupon(null));
    expect(result.current.appliedCoupon).toBeNull();
  });

  it('setSelectedPaymentMethodId updates the selected payment method id', async () => {
    const { result } = await renderHook(() => useCheckout(), { wrapper });

    await act(() => result.current.setSelectedPaymentMethodId('pay-upi'));
    expect(result.current.selectedPaymentMethodId).toBe('pay-upi');

    await act(() => result.current.setSelectedPaymentMethodId(null));
    expect(result.current.selectedPaymentMethodId).toBeNull();
  });

  it('throws when used outside of a CheckoutProvider', async () => {
    await expect(renderHook(() => useCheckout())).rejects.toThrow(
      'useCheckout must be used within CheckoutProvider'
    );
  });
});

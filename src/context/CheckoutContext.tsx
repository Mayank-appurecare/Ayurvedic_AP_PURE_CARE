import React, { createContext, useContext, useState } from 'react';
import { Address, Coupon, DeliveryOption } from '../types';
import { deliveryOptions } from '../data/checkoutOptions';

interface CheckoutContextValue {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  selectedDelivery: DeliveryOption;
  setSelectedDelivery: (delivery: DeliveryOption) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  selectedPaymentMethodId: string | null;
  setSelectedPaymentMethodId: (id: string | null) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>(deliveryOptions[0]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);

  return (
    <CheckoutContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        selectedDelivery,
        setSelectedDelivery,
        appliedCoupon,
        setAppliedCoupon,
        selectedPaymentMethodId,
        setSelectedPaymentMethodId,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}

import { DeliveryOption, PaymentMethodOption } from '../types';

/** The one delivery option whose fee is waived on large enough orders. */
export const STANDARD_DELIVERY_ID = 'delivery-standard';

/** What standard delivery costs below {@link FREE_DELIVERY_THRESHOLD}. */
export const STANDARD_DELIVERY_FEE = 49;

/** Order subtotal at or above which standard delivery is free. */
export const FREE_DELIVERY_THRESHOLD = 499;

export const deliveryOptions: DeliveryOption[] = [
  {
    id: STANDARD_DELIVERY_ID,
    name: 'Standard Delivery',
    description: 'Delivered in 4-6 business days',
    price: STANDARD_DELIVERY_FEE,
    etaLabel: '4-6 days',
  },
  {
    id: 'delivery-express',
    name: 'Express Delivery',
    description: 'Delivered in 1-2 business days',
    price: 79,
    etaLabel: '1-2 days',
  },
  {
    id: 'delivery-sameday',
    name: 'Same Day Delivery',
    description: 'Order before 12 PM to receive it today',
    price: 149,
    etaLabel: 'Today',
  },
];

export const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'pay-upi',
    type: 'upi',
    label: 'UPI',
    icon: 'qr-code-outline',
    description: 'Google Pay, PhonePe, Paytm & more',
  },
  {
    id: 'pay-card',
    type: 'card',
    label: 'Credit / Debit Card',
    icon: 'card-outline',
    description: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'pay-netbanking',
    type: 'netbanking',
    label: 'Net Banking',
    icon: 'business-outline',
    description: 'All major banks supported',
  },
  {
    id: 'pay-wallet',
    type: 'wallet',
    label: 'Wallet',
    icon: 'wallet-outline',
    description: 'Paytm, Amazon Pay & more',
  },
  {
    id: 'pay-cod',
    type: 'cod',
    label: 'Cash on Delivery',
    icon: 'cash-outline',
    description: 'Pay when your order arrives',
  },
];

/**
 * What the customer is actually charged for delivery.
 *
 * This is the only place the fee is decided. The cart, the delivery step and
 * the payment step all call it, so the number shown in the cart is the number
 * the customer pays. Previously the cart applied its own hardcoded fee while
 * payment read `option.price` directly, and the two disagreed by the whole
 * standard delivery fee on every order under the free threshold.
 *
 * A subtotal of zero means an empty cart, which is never charged for delivery.
 */
export function deliveryFeeFor(option: DeliveryOption, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (option.id !== STANDARD_DELIVERY_ID) return option.price;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : option.price;
}

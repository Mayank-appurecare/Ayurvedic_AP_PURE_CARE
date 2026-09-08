import { DeliveryOption, PaymentMethodOption } from '../types';

export const deliveryOptions: DeliveryOption[] = [
  {
    id: 'delivery-standard',
    name: 'Standard Delivery',
    description: 'Delivered in 4-6 business days',
    price: 0,
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

export const FREE_DELIVERY_THRESHOLD = 499;

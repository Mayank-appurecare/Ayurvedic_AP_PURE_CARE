import React from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { CheckoutProvider } from './CheckoutContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CheckoutProvider>{children}</CheckoutProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

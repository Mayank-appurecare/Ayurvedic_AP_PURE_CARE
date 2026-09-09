import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, Product } from '../types';
import { ProductRepository } from '../repositories/ProductRepository';
import { roundCurrency } from '../utils/format';

export interface EnrichedCartItem extends CartItem {
  product: Product;
  variantLabel: string;
  unitPrice: number;
  unitMrp: number;
}

interface CartContextValue {
  items: CartItem[];
  enrichedItems: EnrichedCartItem[];
  savedForLaterItems: EnrichedCartItem[];
  isReady: boolean;
  cartCount: number;
  subtotal: number;
  mrpTotal: number;
  discountTotal: number;
  addToCart: (productId: string, variantId: string, quantity?: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  saveForLater: (productId: string, variantId: string) => void;
  moveToCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  quantityOf: (productId: string, variantId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [productsCache, setProductsCache] = useState<Product[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    ProductRepository.getAll().then((products) => {
      setProductsCache(products);
      setIsReady(true);
    });
  }, []);

  const enrich = (list: CartItem[]): EnrichedCartItem[] =>
    list
      .map((item) => {
        const product = productsCache.find((p) => p.id === item.productId);
        if (!product) return null;
        const variant =
          product.variants.find((v) => v.id === item.variantId) ?? product.variants[0];
        return {
          ...item,
          product,
          variantLabel: variant?.label ?? '',
          unitPrice: variant?.price ?? product.price,
          unitMrp: variant?.mrp ?? product.mrp,
        };
      })
      .filter((x): x is EnrichedCartItem => x !== null);

  const enrichedItems = useMemo(
    () => enrich(items.filter((i) => !i.savedForLater)),
    [items, productsCache]
  );
  const savedForLaterItems = useMemo(
    () => enrich(items.filter((i) => i.savedForLater)),
    [items, productsCache]
  );

  const cartCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = roundCurrency(
    enrichedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );
  const mrpTotal = roundCurrency(enrichedItems.reduce((sum, i) => sum + i.unitMrp * i.quantity, 0));
  const discountTotal = roundCurrency(mrpTotal - subtotal);

  const addToCart: CartContextValue['addToCart'] = (productId, variantId, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === productId && i.variantId === variantId && !i.savedForLater
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity, savedForLater: false } : i
        );
      }
      return [...prev, { productId, variantId, quantity, savedForLater: false }];
    });
  };

  const removeFromCart: CartContextValue['removeFromCart'] = (productId, variantId) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const updateQuantity: CartContextValue['updateQuantity'] = (productId, variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
      )
    );
  };

  const saveForLater: CartContextValue['saveForLater'] = (productId, variantId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, savedForLater: true } : i
      )
    );
  };

  const moveToCart: CartContextValue['moveToCart'] = (productId, variantId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, savedForLater: false } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const isInCart = (productId: string) =>
    items.some((i) => i.productId === productId && !i.savedForLater);

  const quantityOf = (productId: string, variantId: string) =>
    items.find((i) => i.productId === productId && i.variantId === variantId && !i.savedForLater)
      ?.quantity ?? 0;

  const value: CartContextValue = {
    items,
    enrichedItems,
    savedForLaterItems,
    isReady,
    cartCount,
    subtotal,
    mrpTotal,
    discountTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveToCart,
    clearCart,
    isInCart,
    quantityOf,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

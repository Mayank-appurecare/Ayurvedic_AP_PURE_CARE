import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../CartContext';
import { ProductRepository } from '../../repositories/ProductRepository';
import { Product } from '../../types';

jest.mock('../../repositories/ProductRepository', () => ({
  ProductRepository: { getAll: jest.fn() },
}));

function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    name: 'Test Product',
    brand: 'Test Brand',
    categoryId: 'cat-1',
    concernIds: [],
    images: ['https://example.com/p.png'],
    price: 100,
    mrp: 120,
    discountPercent: 17,
    rating: 4.5,
    reviewCount: 10,
    description: '',
    benefits: [],
    ingredients: [],
    howToUse: [],
    productInfo: [],
    faqs: [],
    stock: 10,
    variants: [{ id: 'v1', label: '100g', price: 100, mrp: 120, stock: 10 }],
    ...overrides,
  };
}

const PRODUCTS: Product[] = [
  makeProduct({
    id: 'p1',
    price: 100,
    mrp: 120,
    variants: [{ id: 'v1', label: '100g', price: 100, mrp: 120, stock: 10 }],
  }),
  makeProduct({
    id: 'p2',
    price: 200,
    mrp: 250,
    variants: [{ id: 'v1', label: '200g', price: 200, mrp: 250, stock: 10 }],
  }),
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

beforeEach(() => {
  (ProductRepository.getAll as jest.Mock).mockResolvedValue(PRODUCTS);
});

async function renderReadyCart() {
  const view = await renderHook(() => useCart(), { wrapper });
  await waitForReady(view.result);
  return view;
}

async function waitForReady(result: { current: ReturnType<typeof useCart> }) {
  for (let i = 0; i < 20 && !result.current.isReady; i++) {
    await act(async () => {});
  }
}

describe('CartContext money math', () => {
  it('starts empty with zero totals', async () => {
    const { result } = await renderReadyCart();
    expect(result.current.enrichedItems).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.mrpTotal).toBe(0);
    expect(result.current.discountTotal).toBe(0);
  });

  it('computes subtotal, mrpTotal and discountTotal across multiple items and quantities', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 2)); // 2 x price 100
    await act(() => result.current.addToCart('p2', 'v1', 1)); // 1 x price 200

    expect(result.current.subtotal).toBe(2 * 100 + 1 * 200); // 400
    expect(result.current.mrpTotal).toBe(2 * 120 + 1 * 250); // 490
    expect(result.current.discountTotal).toBe(490 - 400); // 90
    expect(result.current.cartCount).toBe(3);
  });

  it('adding the same product+variant twice increases quantity instead of duplicating the line', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 1));
    await act(() => result.current.addToCart('p1', 'v1', 2));

    expect(result.current.enrichedItems).toHaveLength(1);
    expect(result.current.enrichedItems[0].quantity).toBe(3);
    expect(result.current.subtotal).toBe(3 * 100);
  });

  it('updateQuantity to zero or below removes the item instead of leaving a zero-qty line', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 1));
    await act(() => result.current.updateQuantity('p1', 'v1', 0));

    expect(result.current.enrichedItems).toEqual([]);
    expect(result.current.subtotal).toBe(0);
  });

  it('removeFromCart removes only the targeted line, leaving others untouched', async () => {
    const { result } = await renderReadyCart();

    await act(() => {
      result.current.addToCart('p1', 'v1', 1);
      result.current.addToCart('p2', 'v1', 1);
    });
    await act(() => result.current.removeFromCart('p1', 'v1'));

    expect(result.current.enrichedItems).toHaveLength(1);
    expect(result.current.enrichedItems[0].productId).toBe('p2');
  });

  it('saveForLater moves an item out of the cart total and moveToCart brings it back', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 2));
    expect(result.current.subtotal).toBe(200);

    await act(() => result.current.saveForLater('p1', 'v1'));
    expect(result.current.enrichedItems).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.savedForLaterItems).toHaveLength(1);

    await act(() => result.current.moveToCart('p1', 'v1'));
    expect(result.current.enrichedItems).toHaveLength(1);
    expect(result.current.subtotal).toBe(200);
    expect(result.current.savedForLaterItems).toEqual([]);
  });

  it('isInCart ignores saved-for-later items', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 1));
    expect(result.current.isInCart('p1')).toBe(true);

    await act(() => result.current.saveForLater('p1', 'v1'));
    expect(result.current.isInCart('p1')).toBe(false);
  });

  it('quantityOf reports the live quantity for a productId+variantId pair, 0 when absent', async () => {
    const { result } = await renderReadyCart();

    expect(result.current.quantityOf('p1', 'v1')).toBe(0);

    await act(() => result.current.addToCart('p1', 'v1', 2));
    expect(result.current.quantityOf('p1', 'v1')).toBe(2);

    await act(() => result.current.updateQuantity('p1', 'v1', 5));
    expect(result.current.quantityOf('p1', 'v1')).toBe(5);
  });

  it('keeps the exact decimal value for products with fractional prices, with no floating-point noise', async () => {
    (ProductRepository.getAll as jest.Mock).mockResolvedValue([
      makeProduct({
        id: 'p3',
        price: 33.33,
        mrp: 49.99,
        variants: [{ id: 'v1', label: '50g', price: 33.33, mrp: 49.99, stock: 10 }],
      }),
    ]);
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p3', 'v1', 3));

    expect(result.current.subtotal).toBe(99.99);
    expect(result.current.mrpTotal).toBe(149.97);
    expect(result.current.discountTotal).toBe(49.98);
  });

  it('quantityOf ignores a saved-for-later line for that product+variant', async () => {
    const { result } = await renderReadyCart();

    await act(() => result.current.addToCart('p1', 'v1', 3));
    await act(() => result.current.saveForLater('p1', 'v1'));

    expect(result.current.quantityOf('p1', 'v1')).toBe(0);
  });
});

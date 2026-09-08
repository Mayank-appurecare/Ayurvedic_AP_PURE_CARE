import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { WishlistProvider, useWishlist } from '../WishlistContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WishlistProvider>{children}</WishlistProvider>
);

describe('WishlistContext', () => {
  it('starts empty', async () => {
    const { result } = await renderHook(() => useWishlist(), { wrapper });
    expect(result.current.wishlistIds).toEqual([]);
    expect(result.current.isWishlisted('p1')).toBe(false);
  });

  it('toggles a product into and out of the wishlist', async () => {
    const { result } = await renderHook(() => useWishlist(), { wrapper });

    await act(() => result.current.toggleWishlist('p1'));
    expect(result.current.wishlistIds).toEqual(['p1']);
    expect(result.current.isWishlisted('p1')).toBe(true);

    await act(() => result.current.toggleWishlist('p1'));
    expect(result.current.wishlistIds).toEqual([]);
    expect(result.current.isWishlisted('p1')).toBe(false);
  });

  it('removes a specific product without affecting others', async () => {
    const { result } = await renderHook(() => useWishlist(), { wrapper });

    await act(() => {
      result.current.toggleWishlist('p1');
      result.current.toggleWishlist('p2');
    });
    expect(result.current.wishlistIds).toEqual(['p1', 'p2']);

    await act(() => result.current.removeFromWishlist('p1'));
    expect(result.current.wishlistIds).toEqual(['p2']);
  });

  it('throws when used outside of a WishlistProvider', async () => {
    await expect(renderHook(() => useWishlist())).rejects.toThrow(
      'useWishlist must be used within WishlistProvider'
    );
  });
});

import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';
import { ProductImageGallery } from '../ProductImageGallery';
import { renderScreen } from '../../test-utils/renderScreen';

const IMAGES = [
  'https://example.com/a.png',
  'https://example.com/b.png',
  'https://example.com/c.png',
];

function isActiveDot(dot: ReturnType<typeof screen.getByTestId>) {
  return StyleSheet.flatten(dot.props.style).width === 18;
}

describe('ProductImageGallery', () => {
  it('renders a leaf-icon placeholder when the product has no images, instead of a blank gap', async () => {
    await renderScreen(<ProductImageGallery images={[]} />);

    expect(await screen.findByTestId('product-image-fallback')).toBeTruthy();
    expect(screen.queryByTestId('product-image-gallery')).toBeNull();
  });

  it('renders a swipeable gallery with a dot per image when images are present', async () => {
    await renderScreen(
      <ProductImageGallery images={['https://example.com/a.png', 'https://example.com/b.png']} />
    );

    expect(await screen.findByTestId('product-image-gallery')).toBeTruthy();
    expect(screen.queryByTestId('product-image-fallback')).toBeNull();
  });

  it('moves the active dot as the gallery is scrolled, not just once momentum ends', async () => {
    const width = Dimensions.get('window').width;
    await renderScreen(<ProductImageGallery images={IMAGES} />);
    const gallery = await screen.findByTestId('product-image-gallery');
    expect(isActiveDot(screen.getByTestId('gallery-dot-0'))).toBe(true);

    // A mouse/trackpad drag on web never fires onMomentumScrollEnd, only
    // onScroll — this is the event that must move the dot.
    await fireEvent.scroll(gallery, { nativeEvent: { contentOffset: { x: width } } });

    expect(isActiveDot(screen.getByTestId('gallery-dot-1'))).toBe(true);
    expect(isActiveDot(screen.getByTestId('gallery-dot-0'))).toBe(false);

    await fireEvent.scroll(gallery, { nativeEvent: { contentOffset: { x: width * 2 } } });

    expect(isActiveDot(screen.getByTestId('gallery-dot-2'))).toBe(true);
  });
});

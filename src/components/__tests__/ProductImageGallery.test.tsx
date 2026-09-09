import React from 'react';
import { screen } from '@testing-library/react-native';
import { ProductImageGallery } from '../ProductImageGallery';
import { renderScreen } from '../../test-utils/renderScreen';

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
});

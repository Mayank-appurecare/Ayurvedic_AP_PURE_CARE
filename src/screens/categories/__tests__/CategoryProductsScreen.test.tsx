import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CategoryProductsScreen } from '../CategoryProductsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { aCategory, aProduct } from '../../../test-utils/fixtures';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { gridColumns } from '../../../theme';

jest.mock('../../../repositories/CategoryRepository', () => ({
  CategoryRepository: { getAll: jest.fn() },
}));
jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: {
    getAll: jest.fn(),
    getByCategory: jest.fn(),
    getByConcern: jest.fn(),
    getBrands: jest.fn(),
  },
}));
jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));
jest.mock('../../../context/WishlistContext', () => ({ useWishlist: jest.fn() }));

// Keeps the real breakpoint logic (so the grid renders normally) while making
// the call observable, mirroring how CategoriesScreen.test.tsx covers
// categoryGridColumns. The breakpoint math itself belongs to theme's own tests.
jest.mock('../../../theme', () => {
  const actual = jest.requireActual('../../../theme');
  return { ...actual, gridColumns: jest.fn(actual.gridColumns) };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { categoryId: string; categoryName?: string; concernId?: string };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const PRODUCT_1 = aProduct({ id: 'p1', name: 'Ashwagandha Capsules', brand: 'Himalaya' });
const PRODUCT_2 = aProduct({ id: 'p2', name: 'Aloe Vera Gel', brand: 'Patanjali' });

// "Himalaya" is both PRODUCT_1's own brand label (always on screen) and, once
// the Filter sheet is open, a brand chip inside it — the chip is the second
// (later-in-tree) match.
async function pressHimalayaBrandChip() {
  const matches = await screen.findAllByText('Himalaya');
  await fireEvent.press(matches[matches.length - 1]);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { categoryId: 'cat-1', categoryName: 'Herbal Teas' };
  (useCart as jest.Mock).mockReturnValue({
    addToCart: jest.fn(),
    isInCart: jest.fn().mockReturnValue(false),
  });
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: jest.fn().mockReturnValue(false),
    toggleWishlist: jest.fn(),
  });
  (CategoryRepository.getAll as jest.Mock).mockResolvedValue([
    aCategory({ id: 'cat-9', name: 'Skin Care' }),
  ]);
  (ProductRepository.getBrands as jest.Mock).mockResolvedValue(['Himalaya', 'Patanjali']);
  (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([PRODUCT_1, PRODUCT_2]);
  (ProductRepository.getAll as jest.Mock).mockResolvedValue([]);
  (ProductRepository.getByConcern as jest.Mock).mockResolvedValue([]);
});

describe('CategoryProductsScreen data loading', () => {
  it('shows the loading state until products, categories and brands resolve', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Loading products...')).toBeTruthy();
  });

  it('loads products by category when a categoryId is present, and only that way', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Ashwagandha Capsules');

    expect(ProductRepository.getByCategory).toHaveBeenCalledWith('cat-1', {}, 'relevance');
    expect(ProductRepository.getAll).not.toHaveBeenCalled();
    expect(ProductRepository.getByConcern).not.toHaveBeenCalled();
  });

  it('loads products by concern when a concernId is present, ignoring categoryId', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Dandruff', concernId: 'concern-3' };
    (ProductRepository.getByConcern as jest.Mock).mockResolvedValue([
      aProduct({ id: 'p3', name: 'Bhringraj Oil' }),
    ]);

    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Bhringraj Oil')).toBeTruthy();
    expect(ProductRepository.getByConcern).toHaveBeenCalledWith('concern-3');
    expect(ProductRepository.getByCategory).not.toHaveBeenCalled();
    expect(ProductRepository.getAll).not.toHaveBeenCalled();
  });

  it('loads the whole catalog when there is neither a categoryId nor a concernId', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Products' };
    (ProductRepository.getAll as jest.Mock).mockResolvedValue([
      aProduct({ id: 'p4', name: 'Neem Face Wash' }),
    ]);

    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Neem Face Wash')).toBeTruthy();
    expect(ProductRepository.getAll).toHaveBeenCalledWith({}, 'relevance');
    expect(ProductRepository.getByCategory).not.toHaveBeenCalled();
    expect(ProductRepository.getByConcern).not.toHaveBeenCalled();
  });

  it('renders a card per product and the product count', async () => {
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Ashwagandha Capsules')).toBeTruthy();
    expect(screen.getByText('Aloe Vera Gel')).toBeTruthy();
    expect(screen.getByText('2 products')).toBeTruthy();
  });

  it('shows an error state with retry when loading the products fails', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText("We couldn't load these products.")).toBeTruthy();
  });

  it('reloads when Try Again is pressed after an error', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await renderScreen(<CategoryProductsScreen />);

    const retry = await screen.findByRole('button', { name: 'Try Again' });
    (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([PRODUCT_1]);
    await fireEvent.press(retry);

    expect(await screen.findByText('Ashwagandha Capsules')).toBeTruthy();
  });

  it('shows the empty state with no Clear Filters action when no filters are active', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([]);
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('No products found')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear Filters' })).toBeNull();
  });

  it('shows a Clear Filters action once a filter is active and no products match, and resets it on press', async () => {
    (ProductRepository.getByCategory as jest.Mock)
      .mockResolvedValueOnce([PRODUCT_1, PRODUCT_2]) // initial load
      .mockResolvedValueOnce([]) // after the brand filter is applied
      .mockResolvedValueOnce([PRODUCT_1, PRODUCT_2]); // after Clear Filters is pressed

    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Ashwagandha Capsules');

    // The pill's accessible name includes its leading icon glyph, so match by
    // substring rather than the exact visible label.
    await fireEvent.press(await screen.findByRole('button', { name: /Filter/ }));
    await pressHimalayaBrandChip();
    await fireEvent.press(await screen.findByRole('button', { name: 'Apply Filters' }));

    const clearFilters = await screen.findByRole('button', { name: 'Clear Filters' });
    await fireEvent.press(clearFilters);

    await screen.findByText('Ashwagandha Capsules');
    expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith('cat-1', {}, 'relevance');
  });
});

describe('CategoryProductsScreen navigation', () => {
  it('navigates to ProductDetail when a product card is pressed', async () => {
    await renderScreen(<CategoryProductsScreen />);

    await fireEvent.press(await screen.findByLabelText('Ashwagandha Capsules'));

    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { productId: 'p1' });
  });

  it('goes back when the header back button is pressed', async () => {
    await renderScreen(<CategoryProductsScreen />);

    await fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows the category name passed via route params in the header', async () => {
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Herbal Teas')).toBeTruthy();
  });

  it('falls back to "Products" in the header when no category name is provided', async () => {
    mockRouteParams = { categoryId: '', categoryName: undefined };
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Products')).toBeTruthy();
  });
});

describe('CategoryProductsScreen filtering and sorting', () => {
  it('applies a brand filter chosen in the Filter sheet, reloads with it, and marks the pill active', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Ashwagandha Capsules');

    await fireEvent.press(await screen.findByRole('button', { name: /Filter/ }));
    await pressHimalayaBrandChip();
    await fireEvent.press(await screen.findByRole('button', { name: 'Apply Filters' }));

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith(
        'cat-1',
        { brands: ['Himalaya'] },
        'relevance'
      )
    );
    expect(await screen.findByText('Filter •')).toBeTruthy();
  });

  it('changes the sort order chosen in the Sort sheet and reloads with it', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Ashwagandha Capsules');

    await fireEvent.press(await screen.findByRole('button', { name: /Sort/ }));
    await fireEvent.press(await screen.findByText('Price: Low to High'));

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith(
        'cat-1',
        {},
        'price_low_high'
      )
    );
  });

  it('asks the shared gridColumns helper for the number of grid columns', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Ashwagandha Capsules');

    expect(gridColumns).toHaveBeenCalled();
  });
});

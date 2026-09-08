import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CategoryProductsScreen } from '../CategoryProductsScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { aCategory, aProduct } from '../../../test-utils/fixtures';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { Product } from '../../../types';

jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: {
    getAll: jest.fn(),
    getByCategory: jest.fn(),
    getByConcern: jest.fn(),
    getBrands: jest.fn(),
  },
}));
jest.mock('../../../repositories/CategoryRepository', () => ({
  CategoryRepository: { getAll: jest.fn() },
}));
// ProductCard reaches for both of these.
jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));
jest.mock('../../../context/WishlistContext', () => ({ useWishlist: jest.fn() }));

/**
 * The filter and sort sheets are stubbed with buttons that call their callbacks
 * directly.
 *
 * What this screen owns is how it REACTS to a filter or sort choice — refetch
 * with the right arguments, mark the pill, offer Clear Filters — and which
 * props it hands the sheets. The sheets' own internals (checkbox rows, price
 * buckets) belong to their own component tests. Driving them through a Modal
 * inside a Modal here would test the harness, not the screen.
 */
jest.mock('../../../components/FilterBottomSheet', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    FilterBottomSheet: ({ visible, value, onApply, onClose, hideCategoryFilter }: any) =>
      visible ? (
        <View>
          <Text>{`filter-sheet-open hideCategoryFilter=${String(!!hideCategoryFilter)}`}</Text>
          <Text>{`filter-sheet-value=${JSON.stringify(value)}`}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="apply-in-stock"
            onPress={() => {
              onApply({ inStockOnly: true });
              onClose();
            }}
          >
            <Text>apply-in-stock</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="apply-on-offer"
            onPress={() => {
              onApply({ onOfferOnly: true });
              onClose();
            }}
          >
            <Text>apply-on-offer</Text>
          </Pressable>
        </View>
      ) : null,
  };
});

jest.mock('../../../components/SortBottomSheet', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    SortBottomSheet: ({ visible, value, onSelect, onClose }: any) =>
      visible ? (
        <View>
          <Text>{`sort-sheet-open value=${value}`}</Text>
          {['price_low_high', 'price_high_low', 'rating'].map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`sort-${option}`}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text>{`sort-${option}`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null,
  };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { categoryId: string; categoryName?: string; concernId?: string } = {
  categoryId: '1',
  categoryName: 'Digestive Care',
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

function mockRepositories({
  products = [aProduct()],
  byCategory,
  byConcern,
  brands = [],
}: {
  products?: Product[];
  byCategory?: Product[];
  byConcern?: Product[];
  brands?: string[];
} = {}) {
  (CategoryRepository.getAll as jest.Mock).mockResolvedValue([aCategory()]);
  (ProductRepository.getBrands as jest.Mock).mockResolvedValue(brands);
  (ProductRepository.getAll as jest.Mock).mockResolvedValue(products);
  (ProductRepository.getByCategory as jest.Mock).mockResolvedValue(byCategory ?? products);
  (ProductRepository.getByConcern as jest.Mock).mockResolvedValue(byConcern ?? products);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = { categoryId: '1', categoryName: 'Digestive Care' };
  (useCart as jest.Mock).mockReturnValue({
    addToCart: jest.fn(),
    isInCart: jest.fn().mockReturnValue(false),
  });
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: jest.fn().mockReturnValue(false),
    toggleWishlist: jest.fn(),
  });
  mockRepositories();
});

/**
 * The screen picks one of three repository calls from its route params. Getting
 * this branch wrong is the failure a customer notices immediately — the wrong
 * products, or all of them.
 */
describe('CategoryProductsScreen data source', () => {
  it('loads by category when a categoryId is given', async () => {
    mockRouteParams = { categoryId: '1', categoryName: 'Digestive Care' };
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    expect(ProductRepository.getByCategory).toHaveBeenCalledWith('1', {}, 'relevance');
    expect(ProductRepository.getByConcern).not.toHaveBeenCalled();
    expect(ProductRepository.getAll).not.toHaveBeenCalled();
  });

  it('loads by concern when a concernId is given', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Acidity', concernId: '2' };
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    expect(ProductRepository.getByConcern).toHaveBeenCalledWith('2');
    expect(ProductRepository.getByCategory).not.toHaveBeenCalled();
    expect(ProductRepository.getAll).not.toHaveBeenCalled();
  });

  // A concern wins even with a categoryId present, so the sub-service filter is
  // never silently widened to its whole parent category.
  it('prefers the concern when both a categoryId and a concernId are given', async () => {
    mockRouteParams = { categoryId: '1', categoryName: 'Acidity', concernId: '2' };
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    expect(ProductRepository.getByConcern).toHaveBeenCalledWith('2');
    expect(ProductRepository.getByCategory).not.toHaveBeenCalled();
  });

  // This is what Home's "See All" opens.
  it('loads everything when neither a categoryId nor a concernId is given', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Products' };
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    expect(ProductRepository.getAll).toHaveBeenCalledWith({}, 'relevance');
    expect(ProductRepository.getByCategory).not.toHaveBeenCalled();
    expect(ProductRepository.getByConcern).not.toHaveBeenCalled();
  });
});

describe('CategoryProductsScreen rendering', () => {
  it('shows the category name as the header title', async () => {
    mockRouteParams = { categoryId: '31', categoryName: 'Hair Care' };
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Hair Care')).toBeTruthy();
  });

  it('falls back to "Products" when the route carries no name', async () => {
    mockRouteParams = { categoryId: '' };
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Products')).toBeTruthy();
  });

  it('shows the loading state while products are fetched', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Loading products...')).toBeTruthy();
  });

  it('reports how many products were returned', async () => {
    mockRepositories({
      products: [
        aProduct({ id: '1', name: 'One' }),
        aProduct({ id: '2', name: 'Two' }),
        aProduct({ id: '3', name: 'Three' }),
      ],
    });
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('3 products')).toBeTruthy();
  });

  it('renders a card per product', async () => {
    mockRepositories({
      products: [
        aProduct({ id: '1', name: 'Abhayarishta' }),
        aProduct({ id: '2', name: 'Amalaki Churna' }),
      ],
    });
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('Abhayarishta')).toBeTruthy();
    expect(screen.getByText('Amalaki Churna')).toBeTruthy();
  });

  it('shows the error state when the fetch rejects', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText("We couldn't load these products.")).toBeTruthy();
  });

  it('reloads when retry is pressed after an error', async () => {
    (ProductRepository.getByCategory as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await renderScreen(<CategoryProductsScreen />);

    const retry = await screen.findByRole('button', { name: 'Try Again' });
    mockRepositories({ products: [aProduct({ name: 'Ashokarishta' })] });
    fireEvent.press(retry);

    expect(await screen.findByText('Ashokarishta')).toBeTruthy();
  });

  it('shows the empty state when the category has no products', async () => {
    mockRepositories({ products: [] });
    await renderScreen(<CategoryProductsScreen />);

    expect(await screen.findByText('No products found')).toBeTruthy();
    expect(screen.getByText('0 products')).toBeTruthy();
  });

  // Offering "Clear Filters" with no filters set would be a dead end.
  it('offers no Clear Filters action when the empty result has no filters applied', async () => {
    mockRepositories({ products: [] });
    await renderScreen(<CategoryProductsScreen />);

    await screen.findByText('No products found');
    expect(screen.queryByText('Clear Filters')).toBeNull();
  });
});

describe('CategoryProductsScreen sorting', () => {
  /** Opens the sort sheet and picks one option. */
  async function chooseSort(option: string) {
    fireEvent.press(screen.getByText('Sort'));
    fireEvent.press(await screen.findByLabelText(`sort-${option}`));
  }

  it('starts from relevance', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    expect(ProductRepository.getByCategory).toHaveBeenCalledWith('1', {}, 'relevance');
  });

  it('passes the current sort to the sheet', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    fireEvent.press(screen.getByText('Sort'));

    expect(await screen.findByText('sort-sheet-open value=relevance')).toBeTruthy();
  });

  it('re-fetches cheapest-first when that sort is chosen', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    await chooseSort('price_low_high');

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith('1', {}, 'price_low_high')
    );
  });

  it('re-fetches by customer rating when that sort is chosen', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    await chooseSort('rating');

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith('1', {}, 'rating')
    );
  });

  // On the concern path the repository takes no sort argument, so the screen
  // orders the result itself. A wrong order here would be invisible to the
  // category path's tests, which delegate ordering to the repository.
  it('sorts a concern listing client-side, cheapest first', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Acidity', concernId: '2' };
    mockRepositories({
      byConcern: [
        aProduct({ id: '1', name: 'Costly', price: 500 }),
        aProduct({ id: '2', name: 'Cheap', price: 100 }),
        aProduct({ id: '3', name: 'Mid', price: 300 }),
      ],
    });
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Cheap');

    await chooseSort('price_low_high');

    await waitFor(() => {
      const names = screen.getAllByText(/^(Cheap|Mid|Costly)$/).map((n) => n.props.children);
      expect(names).toEqual(['Cheap', 'Mid', 'Costly']);
    });
  });

  it('sorts a concern listing most expensive first', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Acidity', concernId: '2' };
    mockRepositories({
      byConcern: [
        aProduct({ id: '2', name: 'Cheap', price: 100 }),
        aProduct({ id: '1', name: 'Costly', price: 500 }),
        aProduct({ id: '3', name: 'Mid', price: 300 }),
      ],
    });
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Cheap');

    await chooseSort('price_high_low');

    await waitFor(() => {
      const names = screen.getAllByText(/^(Cheap|Mid|Costly)$/).map((n) => n.props.children);
      expect(names).toEqual(['Costly', 'Mid', 'Cheap']);
    });
  });
});

describe('CategoryProductsScreen filtering', () => {
  /**
   * Opens the filter sheet and applies one filter.
   *
   * The pill is matched by prefix because its label gains a dot once a filter
   * is active, so a second open would not find a bare 'Filter'.
   */
  async function applyFilter(which: 'in-stock' | 'on-offer') {
    openFilterSheet();
    fireEvent.press(await screen.findByLabelText(`apply-${which}`));
  }

  function openFilterSheet() {
    fireEvent.press(screen.getByText(/^Filter/));
  }

  it('re-fetches with the applied filter', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    await applyFilter('in-stock');

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith(
        '1',
        { inStockOnly: true },
        'relevance'
      )
    );
  });

  it('re-fetches with an on-offer filter', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    await applyFilter('on-offer');

    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith(
        '1',
        { onOfferOnly: true },
        'relevance'
      )
    );
  });

  it('marks the Filter pill once a filter is active', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');
    expect(screen.getByText('Filter')).toBeTruthy();

    await applyFilter('on-offer');

    expect(await screen.findByText('Filter •')).toBeTruthy();
  });

  it('hands the sheet the filters currently in effect', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    await applyFilter('in-stock');
    await screen.findByText('Filter •');
    openFilterSheet();

    expect(await screen.findByText('filter-sheet-value={"inStockOnly":true}')).toBeTruthy();
  });

  it('offers Clear Filters on an empty result once filters are active', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([]);
    await applyFilter('in-stock');

    expect(await screen.findByText('No products found')).toBeTruthy();
    expect(screen.getByText('Clear Filters')).toBeTruthy();
  });

  it('clearing the filters from the empty state re-fetches unfiltered', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([]);
    await applyFilter('in-stock');

    const clear = await screen.findByText('Clear Filters');
    (ProductRepository.getByCategory as jest.Mock).mockResolvedValue([
      aProduct({ name: 'Back Again' }),
    ]);
    fireEvent.press(clear);

    expect(await screen.findByText('Back Again')).toBeTruthy();
    await waitFor(() =>
      expect(ProductRepository.getByCategory).toHaveBeenLastCalledWith('1', {}, 'relevance')
    );
  });

  // A concern listing is already scoped to one sub-service, so offering a
  // category filter on top of it would let the customer contradict the screen.
  it('tells the sheet to hide the category filter on a concern listing', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Acidity', concernId: '2' };
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    openFilterSheet();

    expect(await screen.findByText('filter-sheet-open hideCategoryFilter=true')).toBeTruthy();
  });

  it('leaves the category filter visible on a category listing', async () => {
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Abhayarishta');

    openFilterSheet();

    expect(await screen.findByText('filter-sheet-open hideCategoryFilter=false')).toBeTruthy();
  });

  it('filters a concern listing client-side, in-stock only', async () => {
    mockRouteParams = { categoryId: '', categoryName: 'Acidity', concernId: '2' };
    mockRepositories({
      byConcern: [
        aProduct({ id: '1', name: 'In Stock Item', stock: 50 }),
        aProduct({ id: '2', name: 'Sold Out Item', stock: 0 }),
      ],
    });
    await renderScreen(<CategoryProductsScreen />);
    await screen.findByText('Sold Out Item');

    await applyFilter('in-stock');

    expect(await screen.findByText('In Stock Item')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Sold Out Item')).toBeNull());
  });
});

describe('CategoryProductsScreen navigation', () => {
  it('opens the product detail screen from a card', async () => {
    mockRepositories({ products: [aProduct({ id: '8', name: 'Abhayarishta' })] });
    await renderScreen(<CategoryProductsScreen />);

    fireEvent.press(await screen.findByText('Abhayarishta'));

    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { productId: '8' });
  });

  it('goes back from the header', async () => {
    await renderScreen(<CategoryProductsScreen />);

    fireEvent.press(await screen.findByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});

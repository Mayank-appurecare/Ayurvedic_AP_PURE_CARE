import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchScreen } from '../SearchScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { Product } from '../../../types';
import { aProduct } from '../../../test-utils/fixtures';

jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: { search: jest.fn(), getBrands: jest.fn() },
}));
jest.mock('../../../repositories/CategoryRepository', () => ({
  CategoryRepository: { getAll: jest.fn() },
}));
jest.mock('../../../context/WishlistContext', () => ({ useWishlist: jest.fn() }));
jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const RECENT_SEARCHES_KEY = '@ojas_ayurveda/recent_searches';
const PLACEHOLDER = 'Search Ayurvedic products';

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (CategoryRepository.getAll as jest.Mock).mockResolvedValue([]);
  (ProductRepository.getBrands as jest.Mock).mockResolvedValue([]);
  (ProductRepository.search as jest.Mock).mockResolvedValue([]);
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: jest.fn().mockReturnValue(false),
    toggleWishlist: jest.fn(),
  });
  (useCart as jest.Mock).mockReturnValue({
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    isInCart: jest.fn().mockReturnValue(false),
    quantityOf: jest.fn().mockReturnValue(0),
  });
});

describe('SearchScreen', () => {
  it('shows only Popular Searches when there are no recent searches', async () => {
    await renderScreen(<SearchScreen />);

    expect(await screen.findByText('Popular Searches')).toBeTruthy();
    expect(screen.getByText('Ashwagandha')).toBeTruthy();
    expect(screen.queryByText('Recent Searches')).toBeNull();
  });

  it('shows Recent Searches when AsyncStorage has a saved list', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['Neem', 'Aloe Vera']));

    await renderScreen(<SearchScreen />);

    expect(await screen.findByText('Recent Searches')).toBeTruthy();
    expect(screen.getByText('Neem')).toBeTruthy();
    expect(screen.getByText('Aloe Vera')).toBeTruthy();
  });

  it('tapping a Popular Search chip runs a search and persists the term', async () => {
    (ProductRepository.search as jest.Mock).mockResolvedValue([
      aProduct({ id: 'p1', name: 'Ashwagandha Churna' }),
    ]);

    await renderScreen(<SearchScreen />);
    fireEvent.press(await screen.findByText('Ashwagandha'));

    await waitFor(() => expect(ProductRepository.search).toHaveBeenCalledWith('Ashwagandha'));
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['Ashwagandha'])
      )
    );
  });

  it('debounces typed input for 300ms before calling ProductRepository.search', async () => {
    await renderScreen(<SearchScreen />);

    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Turmeric');
    expect(ProductRepository.search).not.toHaveBeenCalled();

    await waitFor(() => expect(ProductRepository.search).toHaveBeenCalledWith('Turmeric'), {
      timeout: 2000,
    });
  });

  it('shows a loading state while a search is in flight', async () => {
    let resolveSearch: (products: Product[]) => void = () => {};
    (ProductRepository.search as jest.Mock).mockImplementation(
      () =>
        new Promise<Product[]>((resolve) => {
          resolveSearch = resolve;
        })
    );

    await renderScreen(<SearchScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Turmeric');

    await waitFor(() => expect(screen.getByText('Searching...')).toBeTruthy(), { timeout: 2000 });

    await act(async () => {
      resolveSearch([]);
    });

    expect(await screen.findByText('No results for "Turmeric"')).toBeTruthy();
  });

  it('shows the no-results empty state, and Browse Categories navigates to the Categories tab', async () => {
    (ProductRepository.search as jest.Mock).mockResolvedValue([]);

    await renderScreen(<SearchScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Zzzz');

    expect(await screen.findByText('No results for "Zzzz"', {}, { timeout: 2000 })).toBeTruthy();

    fireEvent.press(await screen.findByRole('button', { name: 'Browse Categories' }));
    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'CategoriesTab' });
  });

  it('renders the result count and a card per product, and navigates to ProductDetail on press', async () => {
    const p1 = aProduct({ id: 'p1', name: 'Ashwagandha Churna' });
    const p2 = aProduct({ id: 'p2', name: 'Triphala Churna' });
    (ProductRepository.search as jest.Mock).mockResolvedValue([p1, p2]);

    await renderScreen(<SearchScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), 'Churna');

    expect(await screen.findByText('2 results', {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getByText('Ashwagandha Churna')).toBeTruthy();
    expect(screen.getByText('Triphala Churna')).toBeTruthy();

    fireEvent.press(screen.getByText('Ashwagandha Churna'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { productId: 'p1' });
  });

  it('onSubmit persists the term, deduplicating case-insensitively', async () => {
    const seeded = ['ashwagandha', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(seeded));

    await renderScreen(<SearchScreen />);
    await screen.findByText('Recent Searches');

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    // Await each event before firing the next: fireEvent is async, and
    // handleSubmit reads `query` from the closure of the most recently
    // committed render, so the changeText update must be flushed first.
    await fireEvent.changeText(input, 'Ashwagandha');
    await fireEvent(input, 'submitEditing');

    await waitFor(() => expect(ProductRepository.search).toHaveBeenCalledWith('Ashwagandha'));
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['Ashwagandha', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'])
      )
    );
  });

  it('onSubmit caps recent searches at 8 entries, dropping the oldest', async () => {
    const seeded = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(seeded));

    await renderScreen(<SearchScreen />);
    await screen.findByText('Recent Searches');

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    await fireEvent.changeText(input, 'Neem');
    await fireEvent(input, 'submitEditing');

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['Neem', 's1', 's2', 's3', 's4', 's5', 's6', 's7'])
      )
    );
  });
});

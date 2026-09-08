import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { useCart } from '../../../context/CartContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { useWishlist } from '../../../context/WishlistContext';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { ArticleRepository } from '../../../repositories/ArticleRepository';
import { ReviewRepository } from '../../../repositories/ReviewRepository';
import { UserRepository } from '../../../repositories/UserRepository';
import { Article, Category, Concern, Product, Review } from '../../../types';
import {
  aCategory,
  aConcern,
  anAddress,
  anArticle,
  aProduct,
  aReview,
} from '../../../test-utils/fixtures';

jest.mock('../../../context/CartContext', () => ({ useCart: jest.fn() }));
jest.mock('../../../context/WishlistContext', () => ({ useWishlist: jest.fn() }));
jest.mock('../../../context/CheckoutContext', () => ({ useCheckout: jest.fn() }));
jest.mock('../../../repositories/CategoryRepository', () => ({
  CategoryRepository: { getAll: jest.fn(), getConcerns: jest.fn() },
}));
jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: { getApiProducts: jest.fn() },
}));
jest.mock('../../../repositories/ArticleRepository', () => ({
  ArticleRepository: { getAll: jest.fn() },
}));
jest.mock('../../../repositories/ReviewRepository', () => ({
  ReviewRepository: { getRecent: jest.fn() },
}));
jest.mock('../../../repositories/UserRepository', () => ({
  UserRepository: { getAddresses: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

/** Resolves every repository the screen loads in parallel. */
function mockRepositories({
  categories = [aCategory()],
  concerns = [aConcern()],
  products = [aProduct()],
  articles = [anArticle()],
  reviews = [aReview()],
}: {
  categories?: Category[];
  concerns?: Concern[];
  products?: Product[];
  articles?: Article[];
  reviews?: Review[];
} = {}) {
  (CategoryRepository.getAll as jest.Mock).mockResolvedValue(categories);
  (CategoryRepository.getConcerns as jest.Mock).mockResolvedValue(concerns);
  (ProductRepository.getApiProducts as jest.Mock).mockResolvedValue(products);
  (ArticleRepository.getAll as jest.Mock).mockResolvedValue(articles);
  (ReviewRepository.getRecent as jest.Mock).mockResolvedValue(reviews);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useCart as jest.Mock).mockReturnValue({
    cartCount: 0,
    addToCart: jest.fn(),
    isInCart: jest.fn().mockReturnValue(false),
  });
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: jest.fn().mockReturnValue(false),
    toggleWishlist: jest.fn(),
  });
  (useCheckout as jest.Mock).mockReturnValue({
    selectedAddress: null,
    setSelectedAddress: jest.fn(),
  });
  (UserRepository.getAddresses as jest.Mock).mockResolvedValue([]);
  mockRepositories();
});

describe('HomeScreen data loading', () => {
  it('renders the sections once every repository resolves', async () => {
    await renderScreen(<HomeScreen />);

    await screen.findByText('Shop by Category');
    expect(screen.getByText('Shop by Concern')).toBeTruthy();
    expect(screen.getByText('Products')).toBeTruthy();
    expect(screen.getByText('Ayurvedic Wisdom')).toBeTruthy();
  });

  it('shows the loading state before the data arrives', async () => {
    (CategoryRepository.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<HomeScreen />);

    expect(await screen.findByText('Loading AP Pure Care...')).toBeTruthy();
  });

  it('shows the error state with a retry when a repository rejects', async () => {
    (CategoryRepository.getAll as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen(<HomeScreen />);

    expect(await screen.findByText("We couldn't load the home feed.")).toBeTruthy();
  });

  it('reloads the feed when retry is pressed after an error', async () => {
    (CategoryRepository.getAll as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await renderScreen(<HomeScreen />);

    const retry = await screen.findByRole('button', { name: 'Try Again' });
    mockRepositories();
    fireEvent.press(retry);

    expect(await screen.findByText('Shop by Category')).toBeTruthy();
  });

  it('renders the API product list, not mock data', async () => {
    mockRepositories({ products: [aProduct({ id: '99', name: 'Ashokarishta' })] });
    await renderScreen(<HomeScreen />);

    expect(await screen.findByText('Ashokarishta')).toBeTruthy();
    expect(ProductRepository.getApiProducts).toHaveBeenCalled();
  });

  // The rail is a preview; the underlying list stays whole behind "See All".
  it('caps the products rail at six cards', async () => {
    const products = Array.from({ length: 12 }, (_, i) =>
      aProduct({ id: String(i), name: `Product ${i}` })
    );
    mockRepositories({ products });
    await renderScreen(<HomeScreen />);

    expect(await screen.findByText('Product 0')).toBeTruthy();
    expect(await screen.findByText('Product 5')).toBeTruthy();
    expect(screen.queryByText('Product 6')).toBeNull();
  });

  it('shows the products empty state when the catalog carries none', async () => {
    mockRepositories({ products: [] });
    await renderScreen(<HomeScreen />);

    expect(await screen.findByText('No products available right now.')).toBeTruthy();
  });
});

describe('HomeScreen navigation', () => {
  it('opens a category listing when a category card is pressed', async () => {
    mockRepositories({ categories: [aCategory({ id: '1', name: 'Digestive Care' })] });
    await renderScreen(<HomeScreen />);

    fireEvent.press(await screen.findByText('Digestive Care'));

    expect(mockNavigate).toHaveBeenCalledWith('CategoryProducts', {
      categoryId: '1',
      categoryName: 'Digestive Care',
    });
  });

  it('opens a concern listing when a concern chip is pressed', async () => {
    mockRepositories({ concerns: [aConcern({ id: '2', name: 'Acidity' })] });
    await renderScreen(<HomeScreen />);

    fireEvent.press(await screen.findByText('Acidity'));

    expect(mockNavigate).toHaveBeenCalledWith(
      'CategoryProducts',
      expect.objectContaining({ concernId: '2' })
    );
  });

  it('opens the product detail screen when a product card is pressed', async () => {
    mockRepositories({ products: [aProduct({ id: '8', name: 'Abhayarishta' })] });
    await renderScreen(<HomeScreen />);

    fireEvent.press(await screen.findByText('Abhayarishta'));

    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { productId: '8' });
  });

  // Three sections have a "See All"; each must go somewhere different.
  it('sends the Shop by Category "See All" to the Categories tab', async () => {
    await renderScreen(<HomeScreen />);
    const seeAllLinks = await screen.findAllByText('See All');
    fireEvent.press(seeAllLinks[0]);

    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'CategoriesTab' });
  });

  it('sends the Products "See All" to the full product grid', async () => {
    await renderScreen(<HomeScreen />);
    const seeAllLinks = await screen.findAllByText('See All');
    fireEvent.press(seeAllLinks[1]);

    expect(mockNavigate).toHaveBeenCalledWith('CategoryProducts', {
      categoryId: '',
      categoryName: 'Products',
    });
  });

  it('sends the Ayurvedic Wisdom "See All" to the articles list', async () => {
    await renderScreen(<HomeScreen />);
    const seeAllLinks = await screen.findAllByText('See All');
    fireEvent.press(seeAllLinks[2]);

    expect(mockNavigate).toHaveBeenCalledWith('Articles');
  });

  it('opens an article when its card is pressed', async () => {
    mockRepositories({ articles: [anArticle({ id: 'a1', title: 'Understanding Ashwagandha' })] });
    await renderScreen(<HomeScreen />);

    fireEvent.press(await screen.findByText('Understanding Ashwagandha'));

    expect(mockNavigate).toHaveBeenCalledWith('ArticleDetail', { articleId: 'a1' });
  });

  it('opens notifications from the header bell', async () => {
    await renderScreen(<HomeScreen />);
    fireEvent.press(await screen.findByLabelText('Open notifications'));

    expect(mockNavigate).toHaveBeenCalledWith('Notifications');
  });

  it('opens the cart from the header bag', async () => {
    await renderScreen(<HomeScreen />);
    fireEvent.press(await screen.findByLabelText('Open cart'));

    expect(mockNavigate).toHaveBeenCalledWith('CartTab');
  });

  it('opens search when the search bar is pressed', async () => {
    await renderScreen(<HomeScreen />);
    fireEvent(await screen.findByPlaceholderText('Search Ayurvedic products'), 'pressIn');

    expect(mockNavigate).toHaveBeenCalledWith('Search');
  });
});

describe('HomeScreen delivery address', () => {
  it('defaults the delivery pill to the saved default address', async () => {
    const setSelectedAddress = jest.fn();
    (useCheckout as jest.Mock).mockReturnValue({ selectedAddress: null, setSelectedAddress });
    (UserRepository.getAddresses as jest.Mock).mockResolvedValue([
      { id: 'a1', label: 'Home', line1: '12 MG Road', city: 'Bengaluru', pincode: '560001' },
      {
        id: 'a2',
        label: 'Office',
        line1: '5 Brigade Road',
        city: 'Bengaluru',
        pincode: '560025',
        isDefault: true,
      },
    ]);

    await renderScreen(<HomeScreen />);
    await screen.findByText('Shop by Category');

    expect(setSelectedAddress).toHaveBeenCalledWith(expect.objectContaining({ id: 'a2' }));
  });

  it('does not overwrite an address the customer already chose', async () => {
    const setSelectedAddress = jest.fn();
    (useCheckout as jest.Mock).mockReturnValue({
      selectedAddress: { id: 'a1', label: 'Home', city: 'Bengaluru', pincode: '560001' },
      setSelectedAddress,
    });

    await renderScreen(<HomeScreen />);
    await screen.findByText('Shop by Category');

    expect(UserRepository.getAddresses).not.toHaveBeenCalled();
    expect(setSelectedAddress).not.toHaveBeenCalled();
  });
});

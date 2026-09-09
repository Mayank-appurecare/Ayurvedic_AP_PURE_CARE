import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { ProductDetailScreen } from '../ProductDetailScreen';
import { renderScreen } from '../../../test-utils/renderScreen';
import { ProductRepository } from '../../../repositories/ProductRepository';
import { ReviewRepository } from '../../../repositories/ReviewRepository';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { aProduct } from '../../../test-utils/fixtures';
import { Product, Review } from '../../../types';

jest.mock('../../../repositories/ProductRepository', () => ({
  ProductRepository: {
    getById: jest.fn(),
    getRelated: jest.fn(),
    getFrequentlyBoughtTogether: jest.fn(),
  },
}));
jest.mock('../../../repositories/ReviewRepository', () => ({
  ReviewRepository: {
    getSummary: jest.fn(),
    getForProduct: jest.fn(),
  },
}));
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));
jest.mock('../../../context/WishlistContext', () => ({
  useWishlist: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockPush = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack, push: mockPush }),
  useRoute: () => ({ params: { productId: 'p1' } }),
}));

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { star: number; count: number }[];
}

const EMPTY_SUMMARY: ReviewSummary = {
  total: 0,
  average: 0,
  distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })),
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return aProduct({
    id: 'p1',
    name: 'Ashwagandha Churna',
    brand: 'AP Pure Care',
    images: ['https://example.com/a.png'],
    rating: 4.2,
    reviewCount: 120,
    stock: 50,
    variants: [
      { id: 'v1', label: '100g', price: 199, mrp: 249, stock: 50 },
      { id: 'v2', label: '200g', price: 349, mrp: 429, stock: 50 },
    ],
    ...overrides,
  });
}

function mockRepos({
  product = makeProduct(),
  related = [],
  fbt = [],
  summary = EMPTY_SUMMARY,
  reviews = [],
}: {
  product?: Product | undefined;
  related?: Product[];
  fbt?: Product[];
  summary?: ReviewSummary;
  reviews?: Review[];
} = {}) {
  (ProductRepository.getById as jest.Mock).mockResolvedValue(product);
  (ProductRepository.getRelated as jest.Mock).mockResolvedValue(related);
  (ProductRepository.getFrequentlyBoughtTogether as jest.Mock).mockResolvedValue(fbt);
  (ReviewRepository.getSummary as jest.Mock).mockResolvedValue(summary);
  (ReviewRepository.getForProduct as jest.Mock).mockResolvedValue(reviews);
}

const mockAddToCart = jest.fn();
const mockToggleWishlist = jest.fn();
const mockIsWishlisted = jest.fn(() => false);

beforeEach(() => {
  jest.clearAllMocks();
  mockIsWishlisted.mockReturnValue(false);
  (useCart as jest.Mock).mockReturnValue({ addToCart: mockAddToCart, cartCount: 0 });
  (useWishlist as jest.Mock).mockReturnValue({
    isWishlisted: mockIsWishlisted,
    toggleWishlist: mockToggleWishlist,
  });
  mockRepos();
});

describe('ProductDetailScreen', () => {
  it('shows the loading state while the product is loading', async () => {
    (ProductRepository.getById as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('Loading product...')).toBeTruthy();
  });

  it('shows an error state with retry, and reloads successfully', async () => {
    (ProductRepository.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(makeProduct());
    await renderScreen(<ProductDetailScreen />);

    const retryButton = await screen.findByText('Try Again');
    await fireEvent.press(retryButton);

    expect(await screen.findByText('Ashwagandha Churna')).toBeTruthy();
    expect(ProductRepository.getById).toHaveBeenCalledTimes(2);
  });

  it('shows the "Product not found" state and navigates Home from it', async () => {
    (ProductRepository.getById as jest.Mock).mockResolvedValue(undefined);
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('Product not found')).toBeTruthy();
    await fireEvent.press(await screen.findByRole('button', { name: 'Back to Home' }));
    expect(mockNavigate).toHaveBeenCalledWith('Main');
  });

  it('renders the price and "In Stock" text when stock is healthy', async () => {
    mockRepos({
      product: makeProduct({
        variants: [{ id: 'v1', label: '100g', price: 199, mrp: 249, stock: 50 }],
      }),
    });
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('In Stock')).toBeTruthy();
    expect(await screen.findByText('₹199')).toBeTruthy();
  });

  it('shows "Only N left!" when stock is low but not zero', async () => {
    mockRepos({
      product: makeProduct({
        variants: [{ id: 'v1', label: '100g', price: 199, mrp: 249, stock: 10 }],
      }),
    });
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('Only 10 left!')).toBeTruthy();
  });

  it('shows "Out of Stock" and disables Add to Cart / Buy Now when stock is zero', async () => {
    mockRepos({
      product: makeProduct({
        variants: [{ id: 'v1', label: '100g', price: 199, mrp: 249, stock: 0 }],
      }),
    });
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('Out of Stock')).toBeTruthy();
    const addToCartBtn = await screen.findByRole('button', { name: 'Add to Cart' });
    const buyNowBtn = await screen.findByRole('button', { name: 'Buy Now' });
    expect(addToCartBtn.props.accessibilityState?.disabled).toBeTruthy();
    expect(buyNowBtn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('selecting a variant resets the quantity back to 1', async () => {
    await renderScreen(<ProductDetailScreen />);
    await screen.findByText('Ashwagandha Churna');

    await fireEvent.press(await screen.findByLabelText('Increase quantity'));
    await fireEvent.press(await screen.findByLabelText('Increase quantity'));
    await fireEvent.press(await screen.findByText('200g'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v2', 1);
  });

  it('caps the quantity at the variant stock when increasing', async () => {
    mockRepos({
      product: makeProduct({
        variants: [{ id: 'v1', label: '100g', price: 199, mrp: 249, stock: 3 }],
      }),
    });
    await renderScreen(<ProductDetailScreen />);
    await screen.findByText('Ashwagandha Churna');

    const increase = await screen.findByLabelText('Increase quantity');
    for (let i = 0; i < 5; i += 1) await fireEvent.press(increase);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v1', 3);
  });

  it('caps the quantity at 10 even when stock is higher', async () => {
    mockRepos({
      product: makeProduct({
        variants: [{ id: 'v1', label: '100g', price: 199, mrp: 249, stock: 50 }],
      }),
    });
    await renderScreen(<ProductDetailScreen />);
    await screen.findByText('Ashwagandha Churna');

    const increase = await screen.findByLabelText('Increase quantity');
    for (let i = 0; i < 12; i += 1) await fireEvent.press(increase);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v1', 10);
  });

  it('never decreases the quantity below 1', async () => {
    await renderScreen(<ProductDetailScreen />);
    await screen.findByText('Ashwagandha Churna');

    const decrease = await screen.findByLabelText('Decrease quantity');
    await fireEvent.press(decrease);
    await fireEvent.press(decrease);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v1', 1);
  });

  it('adds to cart with the selected variant and quantity', async () => {
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v1', 1);
  });

  it('Buy Now adds to cart then navigates to checkout', async () => {
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Buy Now' }));

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'v1', 1);
    expect(mockNavigate).toHaveBeenCalledWith('CheckoutAddress');
  });

  it('pressing the rating row navigates to Reviews', async () => {
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('View all reviews'));

    expect(mockNavigate).toHaveBeenCalledWith('Reviews', { productId: 'p1' });
  });

  it('shows a "Write a Review" badge next to the name, and it opens WriteReview directly, when the product has no reviews', async () => {
    mockRepos({ product: makeProduct({ reviewCount: 0 }) });
    await renderScreen(<ProductDetailScreen />);

    await fireEvent.press(await screen.findByLabelText('Write a review'));

    expect(await screen.findByText('Write a Review')).toBeTruthy();
    expect(mockNavigate).toHaveBeenCalledWith('WriteReview', { productId: 'p1' });
  });

  it('shows a rating badge next to the name that opens Reviews when the product has ratings', async () => {
    await renderScreen(<ProductDetailScreen />);

    expect(await screen.findByText('4.2 (120)')).toBeTruthy();
  });

  it('pressing "See all N reviews" navigates to Reviews', async () => {
    mockRepos({ summary: { total: 12, average: 4.3, distribution: EMPTY_SUMMARY.distribution } });
    await renderScreen(<ProductDetailScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'See all 12 reviews' }));
    expect(mockNavigate).toHaveBeenCalledWith('Reviews', { productId: 'p1' });
  });

  it('toggles the wishlist for this product', async () => {
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByLabelText('Add to wishlist'));

    expect(mockToggleWishlist).toHaveBeenCalledWith('p1');
  });

  it('"Add All to Cart" adds the main product and every FBT product', async () => {
    mockRepos({
      fbt: [
        aProduct({
          id: 'fbt1',
          name: 'Triphala',
          variants: [{ id: 'fbt1-v1', label: '100g', price: 99, mrp: 120, stock: 20 }],
        }),
        aProduct({
          id: 'fbt2',
          name: 'Neem Tablets',
          variants: [{ id: 'fbt2-v1', label: '60caps', price: 149, mrp: 180, stock: 20 }],
        }),
      ],
    });
    await renderScreen(<ProductDetailScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Add All to Cart' }));

    expect(mockAddToCart).toHaveBeenNthCalledWith(1, 'p1', 'v1', 1);
    expect(mockAddToCart).toHaveBeenNthCalledWith(2, 'fbt1', 'fbt1-v1', 1);
    expect(mockAddToCart).toHaveBeenNthCalledWith(3, 'fbt2', 'fbt2-v1', 1);
    expect(mockAddToCart).toHaveBeenCalledTimes(3);
  });
});

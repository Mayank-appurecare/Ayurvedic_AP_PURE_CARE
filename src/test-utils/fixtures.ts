import { Address, Article, Category, Concern, Product, Review } from '../types';

/**
 * Factories for the app's UI models, so a screen test only states the fields
 * it actually asserts on.
 *
 * No `as` casts anywhere on purpose: these return the real types, so a field
 * renamed in src/types breaks the factory at compile time instead of failing a
 * screen test with an obscure runtime error.
 */

export const aCategory = (overrides: Partial<Category> = {}): Category => ({
  id: '1',
  name: 'Digestive Care',
  icon: 'nutrition-outline',
  productCount: 18,
  ...overrides,
});

export const aConcern = (overrides: Partial<Concern> = {}): Concern => ({
  id: '2',
  name: 'Acidity',
  icon: 'nutrition-outline',
  ...overrides,
});

/** Mirrors what the catalog adapter produces: no brand, image, or rating. */
export const aProduct = (overrides: Partial<Product> = {}): Product => ({
  id: '8',
  name: 'Abhayarishta',
  brand: '',
  categoryId: '3',
  concernIds: [],
  images: [],
  price: 172,
  mrp: 195,
  discountPercent: 12,
  rating: 0,
  reviewCount: 0,
  description: '',
  benefits: [],
  ingredients: [],
  howToUse: [],
  productInfo: [],
  faqs: [],
  stock: 50,
  variants: [{ id: '8-default', label: '450 ml', price: 172, mrp: 195, stock: 50 }],
  ...overrides,
});

export const anArticle = (overrides: Partial<Article> = {}): Article => ({
  id: 'a1',
  title: 'Understanding Ashwagandha',
  category: 'Herbs & Roots',
  tags: ['ashwagandha'],
  image: '',
  excerpt: 'A traditional adaptogen.',
  content: ['Ashwagandha is a classical rasayana herb.'],
  author: 'Dr. Meera Iyer',
  date: '2026-07-01',
  readTimeMinutes: 4,
  ...overrides,
});

export const aReview = (overrides: Partial<Review> = {}): Review => ({
  id: 'r1',
  productId: '8',
  customerName: 'Priya Sharma',
  rating: 5,
  date: '2026-08-12',
  verifiedPurchase: true,
  title: 'Genuinely helps me unwind',
  text: 'Been taking this for a month before bed and I feel calmer through the day.',
  helpfulCount: 24,
  ...overrides,
});

export const anAddress = (overrides: Partial<Address> = {}): Address => ({
  id: 'addr-1',
  label: 'Home',
  fullName: 'Sumiran',
  phone: '9876543210',
  line1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  ...overrides,
});

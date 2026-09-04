// Repository abstraction for products. Screens/hooks call these methods and
// never touch mock data directly. Swap the implementation with real API
// calls later (e.g. fetch('/api/products')) without changing any screen.
import { Product, ProductFilters, SortOption } from '../types';
import { products as mockProducts } from '../data/products';

const MOCK_DELAY = 250;

function delay<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let products: Product[] = [...mockProducts];

function applyFilters(list: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return list;
  let result = list;
  if (filters.categoryIds?.length) {
    result = result.filter((p) => filters.categoryIds!.includes(p.categoryId));
  }
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.brands?.length) {
    result = result.filter((p) => filters.brands!.includes(p.brand));
  }
  if (filters.minRating !== undefined) {
    result = result.filter((p) => p.rating >= filters.minRating!);
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.stock > 0);
  }
  if (filters.onOfferOnly) {
    result = result.filter((p) => p.discountPercent > 0);
  }
  return result;
}

function applySort(list: Product[], sort?: SortOption): Product[] {
  const result = [...list];
  switch (sort) {
    case 'popularity':
      return result.sort((a, b) => b.reviewCount - a.reviewCount);
    case 'rating':
      return result.sort((a, b) => b.rating - a.rating);
    case 'price_low_high':
      return result.sort((a, b) => a.price - b.price);
    case 'price_high_low':
      return result.sort((a, b) => b.price - a.price);
    case 'newest':
      return result.sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
    case 'relevance':
    default:
      return result;
  }
}

export const ProductRepository = {
  async getAll(filters?: ProductFilters, sort?: SortOption): Promise<Product[]> {
    return delay(applySort(applyFilters(products, filters), sort));
  },

  async getById(id: string): Promise<Product | undefined> {
    return delay(products.find((p) => p.id === id));
  },

  async getByCategory(categoryId: string, filters?: ProductFilters, sort?: SortOption): Promise<Product[]> {
    const list = products.filter((p) => p.categoryId === categoryId);
    return delay(applySort(applyFilters(list, filters), sort));
  },

  async getByConcern(concernId: string): Promise<Product[]> {
    return delay(products.filter((p) => p.concernIds.includes(concernId)));
  },

  async getBestSellers(): Promise<Product[]> {
    return delay(products.filter((p) => p.isBestSeller));
  },

  async getFeatured(): Promise<Product[]> {
    return delay(products.filter((p) => p.isFeatured));
  },

  async getNewArrivals(): Promise<Product[]> {
    return delay(products.filter((p) => p.isNewArrival));
  },

  async getRelated(productId: string, limit = 8): Promise<Product[]> {
    const product = products.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(
      products.filter((p) => p.id !== productId && p.categoryId === product.categoryId).slice(0, limit)
    );
  },

  async getFrequentlyBoughtTogether(productId: string, limit = 3): Promise<Product[]> {
    const product = products.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(products.filter((p) => p.id !== productId).slice(0, limit));
  },

  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    return delay(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      )
    );
  },

  async getBrands(): Promise<string[]> {
    return delay(Array.from(new Set(products.map((p) => p.brand))));
  },

  // --- Admin CRUD ---------------------------------------------------
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = { ...product, id: `p-${Date.now()}` };
    products = [newProduct, ...products];
    return delay(newProduct, 500);
  },

  async updateProduct(product: Product): Promise<Product> {
    products = products.map((p) => (p.id === product.id ? product : p));
    return delay(product, 500);
  },

  async deleteProduct(id: string): Promise<void> {
    products = products.filter((p) => p.id !== id);
    return delay(undefined, 400);
  },

  async getLowStock(threshold = 30): Promise<Product[]> {
    return delay(products.filter((p) => p.stock <= threshold));
  },
};

// Repository abstraction for products. Screens/hooks call these methods and
// never touch mock data directly. Swap the implementation with real API
// calls later (e.g. fetch('/api/products')) without changing any screen.
import { Product, ProductFilters, SortOption } from '../types';
import { products as mockProducts } from '../data/products';
import { getCatalog } from '../services/catalog/catalogStore';
import { categoryIdsFor, toUiProducts } from '../services/catalog/productAdapter';

const MOCK_DELAY = 250;

function delay<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let products: Product[] = [...mockProducts];

/**
 * The API's `productList`, mapped to the UI model — or `null` when there is no
 * catalog (guest, or before the first successful OTP verification).
 *
 * The catalog arrives with the auth token, so reading it costs no request.
 */
async function apiProducts(): Promise<Product[] | null> {
  const catalog = await getCatalog();
  if (!catalog?.products.length) return null;
  return toUiProducts(catalog);
}

/** API products when signed in, otherwise the bundled mock list. */
async function activeProducts(): Promise<Product[]> {
  return (await apiProducts()) ?? products;
}

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
  /**
   * The REAL API product list, and nothing else — returns `[]` when no catalog
   * is available instead of falling back to mock data.
   *
   * The Home screen uses this so it can never display mock products: with no
   * catalog it shows its empty state, making the absence of real data visible.
   */
  async getApiProducts(): Promise<Product[]> {
    return (await apiProducts()) ?? [];
  },

  async getAll(filters?: ProductFilters, sort?: SortOption): Promise<Product[]> {
    const list = await activeProducts();
    return delay(applySort(applyFilters(list, filters), sort));
  },

  async getById(id: string): Promise<Product | undefined> {
    const list = await activeProducts();
    return delay(list.find((p) => p.id === id));
  },

  async getByCategory(categoryId: string, filters?: ProductFilters, sort?: SortOption): Promise<Product[]> {
    const fromApi = await apiProducts();
    if (fromApi) {
      // API products carry the most specific category id, so a top-level
      // category matches its own id plus all of its sub-service ids.
      const catalog = await getCatalog();
      const ids = catalog ? categoryIdsFor(catalog, categoryId) : [categoryId];
      const list = fromApi.filter((p) => ids.includes(p.categoryId));
      return delay(applySort(applyFilters(list, filters), sort));
    }
    const list = products.filter((p) => p.categoryId === categoryId);
    return delay(applySort(applyFilters(list, filters), sort));
  },

  async getByConcern(concernId: string): Promise<Product[]> {
    const fromApi = await apiProducts();
    if (fromApi) {
      // A concern IS an API sub-service, so products reference it directly.
      return delay(fromApi.filter((p) => p.categoryId === concernId));
    }
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
    const list = await activeProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(list.filter((p) => p.id !== productId && p.categoryId === product.categoryId).slice(0, limit));
  },

  async getFrequentlyBoughtTogether(productId: string, limit = 3): Promise<Product[]> {
    const list = await activeProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(list.filter((p) => p.id !== productId).slice(0, limit));
  },

  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    const list = await activeProducts();
    return delay(
      list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      )
    );
  },

  async getBrands(): Promise<string[]> {
    const list = await activeProducts();
    // API products carry no brand; drop empties so the filter sheet shows no
    // blank option.
    return delay(Array.from(new Set(list.map((p) => p.brand).filter(Boolean))));
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

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
 * The catalog's `productList`, mapped to the UI model.
 *
 * The catalog store serves the API payload once a user has verified an OTP and
 * the bundled copy otherwise, so a guest browses the same product list as a
 * signed-in user. Reading it costs no request either way.
 */
async function catalogProducts(): Promise<Product[]> {
  return toUiProducts(await getCatalog());
}

/**
 * TEMPORARY placeholder photos for the product detail page.
 *
 * The API sends no image URLs at all today, so toUiProduct() correctly
 * leaves `images` empty rather than inventing one — that adapter contract is
 * right and stays as-is. But with nothing to show, the detail page's gallery
 * can only ever render its single leaf-icon fallback, which makes swiping
 * through multiple photos untestable in the meantime.
 *
 * Seeded by the product's own id, so the same product always shows the same
 * three placeholder photos rather than a different random set on every load.
 * Delete this the moment the backend starts sending real image URLs.
 */
function demoImagesFor(productId: string): string[] {
  return [1, 2, 3].map((n) => `https://picsum.photos/seed/${productId}-${n}/900/900`);
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
   * The catalog product list, and nothing else — never mock data.
   *
   * The Home screen uses this so what it shows always comes from the catalog,
   * and it renders its empty state if the catalog ever carries no products.
   */
  async getApiProducts(): Promise<Product[]> {
    return catalogProducts();
  },

  async getAll(filters?: ProductFilters, sort?: SortOption): Promise<Product[]> {
    const list = await catalogProducts();
    return delay(applySort(applyFilters(list, filters), sort));
  },

  async getById(id: string): Promise<Product | undefined> {
    const list = await catalogProducts();
    const product = list.find((p) => p.id === id);
    if (!product) return delay(undefined);
    return delay(
      product.images.length ? product : { ...product, images: demoImagesFor(product.id) }
    );
  },

  async getByCategory(
    categoryId: string,
    filters?: ProductFilters,
    sort?: SortOption
  ): Promise<Product[]> {
    // Products carry the most specific category id, so a top-level category
    // matches its own id plus all of its sub-service ids.
    const catalog = await getCatalog();
    const ids = categoryIdsFor(catalog, categoryId);
    const list = toUiProducts(catalog).filter((p) => ids.includes(p.categoryId));
    return delay(applySort(applyFilters(list, filters), sort));
  },

  async getByConcern(concernId: string): Promise<Product[]> {
    // A concern IS a sub-service, so products reference it directly.
    const list = await catalogProducts();
    return delay(list.filter((p) => p.categoryId === concernId));
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
    const list = await catalogProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(
      list.filter((p) => p.id !== productId && p.categoryId === product.categoryId).slice(0, limit)
    );
  },

  async getFrequentlyBoughtTogether(productId: string, limit = 3): Promise<Product[]> {
    const list = await catalogProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) return delay([]);
    return delay(list.filter((p) => p.id !== productId).slice(0, limit));
  },

  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    const list = await catalogProducts();
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
    const list = await catalogProducts();
    // Catalog products carry no brand; drop empties so the filter sheet shows
    // no blank option.
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

import { categories as mockCategories, concerns } from '../data/categories';
import { Category, Concern } from '../types';
import { getCatalog } from '../services/catalog/catalogStore';
import { toUiCategories, toUiConcerns } from '../services/catalog/categoryAdapter';

const delay = <T,>(value: T, ms = 200): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let categories: Category[] = [...mockCategories];

// The backend returns the real catalog alongside the auth token, so once a user
// has verified an OTP these read from that stored payload instead of the mock
// list — no extra network request. A guest (or a signed-out app) has no catalog
// and keeps the mock data, which is what preserves guest browsing.
export const CategoryRepository = {
  async getAll(): Promise<Category[]> {
    const catalog = await getCatalog();
    if (catalog?.categories.length) return toUiCategories(catalog);
    return delay(categories);
  },
  async getById(id: string): Promise<Category | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.id === id);
  },
  async getConcerns(): Promise<Concern[]> {
    const catalog = await getCatalog();
    const apiConcerns = catalog ? toUiConcerns(catalog) : [];
    if (apiConcerns.length) return apiConcerns;
    return delay(concerns);
  },

  // --- Admin CRUD ---------------------------------------------------
  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCategory: Category = { ...category, id: `cat-${Date.now()}` };
    categories = [...categories, newCategory];
    return delay(newCategory, 400);
  },

  async updateCategory(category: Category): Promise<Category> {
    categories = categories.map((c) => (c.id === category.id ? category : c));
    return delay(category, 400);
  },

  async deleteCategory(id: string): Promise<void> {
    categories = categories.filter((c) => c.id !== id);
    return delay(undefined, 300);
  },
};

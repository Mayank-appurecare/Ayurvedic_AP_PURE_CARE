import { categories as mockCategories } from '../data/categories';
import { Category, Concern } from '../types';
import { getCatalog } from '../services/catalog/catalogStore';
import { toUiCategories, toUiConcerns } from '../services/catalog/categoryAdapter';

const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let categories: Category[] = [...mockCategories];

// Customer reads go through the catalog store, which serves the API payload
// once a user has verified an OTP and the bundled copy otherwise. Both are the
// same shape, so a guest sees exactly the same categories and concerns as a
// signed-in user — one code path, no branch that can drift.
export const CategoryRepository = {
  async getAll(): Promise<Category[]> {
    return toUiCategories(await getCatalog());
  },
  async getById(id: string): Promise<Category | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.id === id);
  },
  async getConcerns(): Promise<Concern[]> {
    return toUiConcerns(await getCatalog());
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

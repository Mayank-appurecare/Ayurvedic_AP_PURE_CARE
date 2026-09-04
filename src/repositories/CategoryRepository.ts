import { categories as mockCategories, concerns } from '../data/categories';
import { Category, Concern } from '../types';

const delay = <T,>(value: T, ms = 200): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let categories: Category[] = [...mockCategories];

export const CategoryRepository = {
  async getAll(): Promise<Category[]> {
    return delay(categories);
  },
  async getById(id: string): Promise<Category | undefined> {
    return delay(categories.find((c) => c.id === id));
  },
  async getConcerns(): Promise<Concern[]> {
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

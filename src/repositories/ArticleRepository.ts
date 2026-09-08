import { articles as mockArticles } from '../data/articles';
import { Article } from '../types';

const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let articles: Article[] = [...mockArticles];

export const ArticleRepository = {
  async getAll(): Promise<Article[]> {
    return delay(articles);
  },
  async getById(id: string): Promise<Article | undefined> {
    return delay(articles.find((a) => a.id === id));
  },
  async getFeatured(): Promise<Article | undefined> {
    return delay(articles.find((a) => a.isFeatured));
  },
  async getByCategory(category: string): Promise<Article[]> {
    return delay(articles.filter((a) => a.category === category));
  },
  async getRelated(id: string, limit = 4): Promise<Article[]> {
    const article = articles.find((a) => a.id === id);
    if (!article) return delay([]);
    return delay(
      articles.filter((a) => a.id !== id && a.category === article.category).slice(0, limit)
    );
  },
  async search(query: string): Promise<Article[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    return delay(
      articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))
      )
    );
  },

  // --- Admin CRUD ---------------------------------------------------
  async createArticle(article: Omit<Article, 'id'>): Promise<Article> {
    const newArticle: Article = { ...article, id: `art-${Date.now()}` };
    articles = [newArticle, ...articles];
    return delay(newArticle, 400);
  },

  async updateArticle(article: Article): Promise<Article> {
    articles = articles.map((a) => (a.id === article.id ? article : a));
    return delay(article, 400);
  },

  async deleteArticle(id: string): Promise<void> {
    articles = articles.filter((a) => a.id !== id);
    return delay(undefined, 300);
  },
};

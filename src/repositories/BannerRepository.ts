import { banners as mockBanners } from '../data/banners';
import { Banner } from '../types';

const delay = <T,>(value: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let banners: Banner[] = [...mockBanners];

export const BannerRepository = {
  async getAll(): Promise<Banner[]> {
    return delay(banners);
  },

  async createBanner(banner: Omit<Banner, 'id'>): Promise<Banner> {
    const newBanner: Banner = { ...banner, id: `banner-${Date.now()}` };
    banners = [newBanner, ...banners];
    return delay(newBanner, 400);
  },

  async updateBanner(banner: Banner): Promise<Banner> {
    banners = banners.map((b) => (b.id === banner.id ? banner : b));
    return delay(banner, 400);
  },

  async deleteBanner(id: string): Promise<void> {
    banners = banners.filter((b) => b.id !== id);
    return delay(undefined, 300);
  },
};

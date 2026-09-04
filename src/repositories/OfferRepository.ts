import { coupons as mockCoupons, offers as mockOffers } from '../data/coupons';
import { Coupon, Offer } from '../types';

const delay = <T,>(value: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms));

// In-memory store seeded from mock data so admin create/update/delete
// operations persist for the session without a real backend.
let offers: Offer[] = [...mockOffers];
let coupons: Coupon[] = [...mockCoupons];

export const OfferRepository = {
  async getOffers(): Promise<Offer[]> {
    return delay(offers);
  },

  async getCoupons(): Promise<Coupon[]> {
    return delay(coupons);
  },

  async validateCoupon(code: string, orderValue: number): Promise<{ valid: boolean; coupon?: Coupon; message: string }> {
    const coupon = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!coupon) {
      return delay({ valid: false, message: 'Invalid coupon code.' }, 400);
    }
    if (coupon.isApplicable === false) {
      return delay({ valid: false, message: 'This coupon has expired or is not applicable.' }, 400);
    }
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return delay(
        { valid: false, message: `Add items worth ₹${coupon.minOrderValue - orderValue} more to use this coupon.` },
        400
      );
    }
    return delay({ valid: true, coupon, message: 'Coupon applied successfully!' }, 400);
  },

  // --- Admin CRUD ---------------------------------------------------
  async createOffer(offer: Omit<Offer, 'id'>): Promise<Offer> {
    const newOffer: Offer = { ...offer, id: `offer-${Date.now()}` };
    offers = [newOffer, ...offers];
    return delay(newOffer, 400);
  },

  async updateOffer(offer: Offer): Promise<Offer> {
    offers = offers.map((o) => (o.id === offer.id ? offer : o));
    return delay(offer, 400);
  },

  async deleteOffer(id: string): Promise<void> {
    offers = offers.filter((o) => o.id !== id);
    return delay(undefined, 300);
  },

  async createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    const newCoupon: Coupon = { ...coupon, id: `coupon-${Date.now()}` };
    coupons = [newCoupon, ...coupons];
    return delay(newCoupon, 400);
  },

  async updateCoupon(coupon: Coupon): Promise<Coupon> {
    coupons = coupons.map((c) => (c.id === coupon.id ? coupon : c));
    return delay(coupon, 400);
  },

  async deleteCoupon(id: string): Promise<void> {
    coupons = coupons.filter((c) => c.id !== id);
    return delay(undefined, 300);
  },
};

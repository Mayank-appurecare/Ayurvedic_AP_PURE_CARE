import { OfferRepository } from '../OfferRepository';
import { coupons as mockCoupons, offers as mockOffers } from '../../data/coupons';

// OfferRepository never gets a mutating call in this file (createOffer/
// updateOffer/deleteOffer/createCoupon/updateCoupon/deleteCoupon are
// admin-only and out of scope), so there's no shared-store leakage to guard
// against and no jest.resetModules() dance is needed here.
describe('OfferRepository', () => {
  describe('getOffers', () => {
    it('returns the seed offers list', async () => {
      await expect(OfferRepository.getOffers()).resolves.toEqual(mockOffers);
    });
  });

  describe('getCoupons', () => {
    it('returns the seed coupons list', async () => {
      await expect(OfferRepository.getCoupons()).resolves.toEqual(mockCoupons);
    });
  });

  describe('validateCoupon', () => {
    it('rejects an unknown coupon code', async () => {
      await expect(OfferRepository.validateCoupon('NOTREAL', 1000)).resolves.toEqual({
        valid: false,
        message: 'Invalid coupon code.',
      });
    });

    it('matches a real coupon code case-insensitively and with surrounding whitespace', async () => {
      const coupon = mockCoupons.find((c) => c.code === 'APWELCOME')!;
      const result = await OfferRepository.validateCoupon(
        `  ${coupon.code.toLowerCase()}  `,
        coupon.minOrderValue!
      );
      expect(result).toEqual({
        valid: true,
        coupon,
        message: 'Coupon applied successfully!',
      });
    });

    it('reports how much more is needed when the order value is under minOrderValue', async () => {
      const coupon = mockCoupons.find((c) => c.code === 'IMMUNITY20')!;
      const orderValue = coupon.minOrderValue! - 100;
      const result = await OfferRepository.validateCoupon(coupon.code, orderValue);
      expect(result).toEqual({
        valid: false,
        message: `Add items worth ₹${coupon.minOrderValue! - orderValue} more to use this coupon.`,
      });
    });

    it('resolves valid with the coupon when the order value fully qualifies', async () => {
      const coupon = mockCoupons.find((c) => c.code === 'FREESHIP')!;
      const result = await OfferRepository.validateCoupon(coupon.code, coupon.minOrderValue!);
      expect(result).toEqual({
        valid: true,
        coupon,
        message: 'Coupon applied successfully!',
      });
    });

    // The seed data already has a coupon with isApplicable: false (FLAT150 in
    // src/data/coupons.ts), so it's used directly here instead of reaching for
    // createCoupon as fixture setup.
    it('rejects a coupon whose isApplicable flag is false, even when the order value qualifies', async () => {
      const coupon = mockCoupons.find((c) => c.code === 'FLAT150')!;
      expect(coupon.isApplicable).toBe(false);
      const result = await OfferRepository.validateCoupon(coupon.code, coupon.minOrderValue!);
      expect(result).toEqual({
        valid: false,
        message: 'This coupon has expired or is not applicable.',
      });
    });
  });
});

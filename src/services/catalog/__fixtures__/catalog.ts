import { ApiCategory, ApiProduct, AuthCatalog } from '../../auth/types';

/**
 * Builds a complete `ApiProduct` so tests only state the fields they care
 * about. Defaults mirror a plain in-stock product with no discount, which
 * keeps pricing assertions readable.
 */
export function apiProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: 1,
    sku: 'AY-TEST-001',
    name: 'Test Product',
    categoryId: 1,
    description: null,
    classicalReference: null,
    composition: null,
    dosageForm: null,
    dosha: null,
    formulationClass: null,
    packSize: null,
    ayushLicenceNo: null,
    price: 100,
    discountPercentage: 0,
    stockQuantity: 10,
    prescriptionRequired: false,
    scheduleE1: false,
    containsHeavyMetals: false,
    ...overrides,
  };
}

export function apiCategory(overrides: Partial<ApiCategory> = {}): ApiCategory {
  return { id: 1, name: 'Test Category', description: null, ...overrides };
}

export function authCatalog(categories: ApiCategory[], products: ApiProduct[] = []): AuthCatalog {
  return { categories, products };
}

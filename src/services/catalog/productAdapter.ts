// Maps the API's `productList[]` onto the app's existing `Product` UI model.
//
// CONTRACT: names, prices, ids and stock come from the API verbatim. Nothing
// here invents a value the backend did not send — fields the API has no source
// for are left empty so the existing UI renders its own empty state.
//
// WHAT THE API SENDS: id, sku, name, description, classicalReference,
// composition, dosageForm, dosha, formulationClass, packSize, ayushLicenceNo,
// price, discountPercentage, stockQuantity, prescriptionRequired, scheduleE1,
// containsHeavyMetals, categoryId.
//
// WHAT IT DOES NOT SEND: image, rating, reviewCount, brand, MRP, variants.

import { ApiProduct, AuthCatalog } from '../auth/types';
import { Product, ProductVariant } from '../../types';

/**
 * The API sends `price` together with `discountPercentage`, and no separate
 * MRP. This treats `price` as the LIST price and derives the payable price
 * from the discount — the conventional reading of that field pair, and the
 * only one that makes the discount badge and the strike-through agree.
 *
 * If the backend actually returns `price` already net of the discount, this is
 * the ONE function to change: set `price: api.price` and `mrp: api.price`.
 */
function derivePricing(api: ApiProduct): { price: number; mrp: number; discountPercent: number } {
  const mrp = Math.max(0, api.price);
  const discountPercent = Math.min(100, Math.max(0, Math.round(api.discountPercentage)));
  const price = discountPercent > 0 ? Math.round(mrp * (1 - discountPercent / 100)) : mrp;
  return { price, mrp, discountPercent };
}

/**
 * Every product needs at least one variant: `ProductCard` and
 * `ProductDetailScreen` both index `variants[0]` when adding to the cart, and
 * would crash on an empty array.
 *
 * This is a structural shim, not invented data — the label is the API's own
 * `packSize`, and price/stock come straight from the API.
 */
function buildDefaultVariant(api: ApiProduct, price: number, mrp: number): ProductVariant {
  return {
    id: `${api.id}-default`,
    label: api.packSize ?? 'Standard',
    price,
    mrp,
    stock: Math.max(0, api.stockQuantity),
  };
}

/** Turns the API's spec fields into the detail screen's label/value rows. */
function buildProductInfo(api: ApiProduct): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value: string | null) => {
    if (value) rows.push({ label, value });
  };
  add('SKU', api.sku);
  add('Pack Size', api.packSize);
  add('Dosage Form', api.dosageForm);
  add('Dosha', api.dosha);
  add('Formulation', api.formulationClass);
  add('Classical Reference', api.classicalReference);
  add('AYUSH Licence No.', api.ayushLicenceNo);
  if (api.prescriptionRequired) rows.push({ label: 'Prescription', value: 'Required' });
  if (api.containsHeavyMetals) rows.push({ label: 'Contains Heavy Metals', value: 'Yes' });
  return rows;
}

/** One API product → the app's `Product`. */
export function toUiProduct(api: ApiProduct): Product {
  const { price, mrp, discountPercent } = derivePricing(api);

  return {
    id: String(api.id),
    name: api.name,
    // The API has no brand field. Empty string is the UI's existing no-brand
    // state (ProductCard renders an empty line rather than a placeholder).
    brand: '',
    categoryId: String(api.categoryId),
    concernIds: [],
    // No image is sent. An empty array makes ProductCard/ProductDetail fall
    // back to their placeholder rather than loading an invented URL.
    images: [],
    price,
    mrp,
    discountPercent,
    // No rating or review data is sent; 0 is the UI's existing empty state.
    rating: 0,
    reviewCount: 0,
    description: api.description ?? '',
    benefits: [],
    // `composition` is the API's ingredient list, comma separated.
    ingredients: api.composition
      ? api.composition
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : [],
    howToUse: [],
    productInfo: buildProductInfo(api),
    faqs: [],
    stock: Math.max(0, api.stockQuantity),
    variants: [buildDefaultVariant(api, price, mrp)],
  };
}

/** The whole `productList`, in the order the API returned it. */
export function toUiProducts(catalog: AuthCatalog): Product[] {
  return catalog.products.map(toUiProduct);
}

/**
 * Top-level category id → every API category id that rolls up to it (itself
 * plus its sub-services).
 *
 * Products carry the most specific `categoryId`, so filtering a top-level
 * category by equality alone would return nothing.
 */
export function categoryIdsFor(catalog: AuthCatalog, categoryId: string): string[] {
  const category = catalog.categories.find((c) => String(c.id) === categoryId);
  if (!category) return [categoryId];
  return [String(category.id), ...(category.subService ?? []).map((child) => String(child.id))];
}

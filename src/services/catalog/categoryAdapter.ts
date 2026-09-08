// Maps the API's category wire shape onto the app's existing UI models
// (`Category` and `Concern`), so no screen or component needs to change.
//
// CONTRACT: category and sub-service NAMES are passed through verbatim. The API
// is the source of truth for them — nothing here renames, shortens or
// prettifies a name. Only presentation fields the API does not send (the
// Ionicons glyph) are derived, and product counts are computed.

import { ApiCategory, AuthCatalog } from '../auth/types';
import { Category, Concern } from '../../types';

/**
 * Categories the customer app never shows.
 *
 * The backend carries seed/demo rows next to the real ones (e.g. "Digestive
 * Care Demo"). They are dropped here — the single place API categories become
 * UI categories — so every screen that reads through the repository is covered
 * at once, and no screen needs a name check of its own.
 *
 * The word boundary keeps this from ever catching a real name: only a
 * standalone "demo" matches, so "Digestive Care" itself is untouched.
 */
const HIDDEN_CATEGORY_PATTERN = /\bdemo\b/i;

/** `false` for seed/demo categories that must not reach the customer UI. */
export function isCustomerFacingCategory(category: ApiCategory): boolean {
  return !HIDDEN_CATEGORY_PATTERN.test(category.name);
}

/**
 * Keyword → Ionicons glyph. The API sends no icon, so one is derived from the
 * name for display only.
 *
 * ORDER MATTERS: entries are tested top-down and the first hit wins. "women"
 * must precede "men", because "Women's Health" contains the substring "men".
 * Every glyph here was checked against the installed Ionicons glyphmap.
 */
const ICON_RULES: { match: RegExp; icon: string }[] = [
  { match: /women|menstrual|pcos|fertilit|lactat|menopause/i, icon: 'woman-outline' },
  { match: /baby|kid|child/i, icon: 'happy-outline' },
  { match: /diabet|sugar/i, icon: 'water-outline' },
  { match: /digest|gut|acidit|constipat|liver|piles/i, icon: 'nutrition-outline' },
  { match: /\bear\b|ear care/i, icon: 'ear-outline' },
  { match: /\beye\b|eye care|vision/i, icon: 'eye-outline' },
  { match: /hair|dandruff|greying/i, icon: 'cut-outline' },
  { match: /heart|cholesterol|\bbp\b|circulat/i, icon: 'heart-outline' },
  { match: /immun|seasonal|rasayana|anti-ageing/i, icon: 'shield-checkmark-outline' },
  { match: /joint|bone|arthrit|back pain/i, icon: 'body-outline' },
  { match: /kidney|urinary|stone|uti/i, icon: 'water-outline' },
  { match: /oral|dental|teeth|tooth/i, icon: 'happy-outline' },
  { match: /pain|balm|liniment/i, icon: 'bandage-outline' },
  { match: /respirat|cough|cold|asthma|sinus|throat/i, icon: 'medkit-outline' },
  { match: /skin|acne|face|pigmentat|eczema|body care/i, icon: 'sparkles-outline' },
  { match: /stress|sleep|mind|anxiet|memory|focus/i, icon: 'moon-outline' },
  { match: /weight|metabol/i, icon: 'barbell-outline' },
  { match: /\bmen\b|men's|prostate|vitalit|performance/i, icon: 'man-outline' },
  { match: /massage|oil/i, icon: 'leaf-outline' },
];

const DEFAULT_ICON = 'leaf-outline';

export function iconForName(name: string): string {
  for (const rule of ICON_RULES) {
    if (rule.match.test(name)) return rule.icon;
  }
  return DEFAULT_ICON;
}

/**
 * Counts products for a category.
 *
 * `productList[].categoryId` points at the most specific node, which is usually
 * a sub-service, so a top-level category's count is its own direct products
 * plus those of all its children.
 */
function countProducts(category: ApiCategory, byCategoryId: Map<number, number>): number {
  let total = byCategoryId.get(category.id) ?? 0;
  for (const child of category.subService ?? []) {
    total += byCategoryId.get(child.id) ?? 0;
  }
  return total;
}

/** Groups the product list into counts per `categoryId`. */
function buildCountIndex(catalog: AuthCatalog): Map<number, number> {
  const index = new Map<number, number>();
  for (const product of catalog.products) {
    index.set(product.categoryId, (index.get(product.categoryId) ?? 0) + 1);
  }
  return index;
}

/**
 * API categories → the app's `Category[]`.
 *
 * `id` keeps the API's own identifier (as a string, which is what the app's `ID`
 * type and navigation params use) so it can be passed straight back to the
 * backend. `image` is intentionally left undefined: the API sends none, and
 * `CategoryCard` falls back to the `icon` rather than showing a broken image.
 */
export function toUiCategories(catalog: AuthCatalog): Category[] {
  const counts = buildCountIndex(catalog);
  return catalog.categories.filter(isCustomerFacingCategory).map((category) => ({
    id: String(category.id),
    name: category.name,
    icon: iconForName(category.name),
    description: category.description ?? undefined,
    productCount: countProducts(category, counts),
  }));
}

/**
 * Sub-services → the app's `Concern[]`, which is the existing "Shop by Concern"
 * UI model. Children of every category are flattened in the order the API
 * returned them, keeping each sub-service's own API id.
 */
export function toUiConcerns(catalog: AuthCatalog): Concern[] {
  const concerns: Concern[] = [];
  const seen = new Set<number>();
  // Demo categories are skipped here too, so their sub-services never surface
  // as "Shop by Concern" chips.
  for (const category of catalog.categories.filter(isCustomerFacingCategory)) {
    for (const child of category.subService ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      concerns.push({ id: String(child.id), name: child.name, icon: iconForName(child.name) });
    }
  }
  return concerns;
}

/** Sub-services of one category, for callers that need the parent relation. */
export function subCategoriesOf(catalog: AuthCatalog, categoryId: string): Concern[] {
  const category = catalog.categories.find((c) => String(c.id) === categoryId);
  if (!category) return [];
  return (category.subService ?? []).map((child) => ({
    id: String(child.id),
    name: child.name,
    icon: iconForName(child.name),
  }));
}

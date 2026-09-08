import {
  iconForName,
  isCustomerFacingCategory,
  subCategoriesOf,
  toUiCategories,
  toUiConcerns,
} from '../categoryAdapter';
import { apiCategory, apiProduct, authCatalog } from '../__fixtures__/catalog';

/**
 * A miniature catalog shaped exactly like the API's payload: two real
 * categories with sub-services, one childless category, and one seed/demo row.
 * Products reference the most specific node, which is what makes the roll-up
 * arithmetic worth asserting.
 */
const catalog = authCatalog(
  [
    apiCategory({
      id: 1,
      name: 'Digestive Care',
      subService: [
        { id: 2, name: 'Acidity', description: null },
        { id: 3, name: 'Constipation', description: null },
      ],
    }),
    apiCategory({ id: 59, name: 'Eye Care' }),
    apiCategory({
      id: 46,
      name: "Women's Health",
      subService: [{ id: 47, name: 'Menstrual', description: null }],
    }),
    apiCategory({
      id: 70,
      name: 'Digestive Care Demo',
      subService: [{ id: 71, name: 'Demo Sub', description: null }],
    }),
  ],
  [
    // 1 filed on the parent + 2 on children -> Digestive Care rolls up to 3
    apiProduct({ id: 10, categoryId: 1 }),
    apiProduct({ id: 11, categoryId: 2 }),
    apiProduct({ id: 12, categoryId: 3 }),
    apiProduct({ id: 13, categoryId: 47 }),
    apiProduct({ id: 14, categoryId: 71 }),
  ]
);

describe('isCustomerFacingCategory', () => {
  it('hides a seed/demo category', () => {
    expect(isCustomerFacingCategory(apiCategory({ name: 'Digestive Care Demo' }))).toBe(false);
    expect(isCustomerFacingCategory(apiCategory({ name: 'DEMO Products' }))).toBe(false);
  });

  // The pattern is word-bounded on purpose, so a real name is never caught.
  it('keeps real names that merely contain the letters "demo"', () => {
    expect(isCustomerFacingCategory(apiCategory({ name: 'Digestive Care' }))).toBe(true);
    expect(isCustomerFacingCategory(apiCategory({ name: 'Demographic Wellness' }))).toBe(true);
  });
});

describe('iconForName', () => {
  // "Women's Health" contains the substring "men", so rule order decides this.
  it('maps women-related names to the woman glyph, not the man glyph', () => {
    expect(iconForName("Women's Health")).toBe('woman-outline');
    expect(iconForName('Menopause')).toBe('woman-outline');
  });

  it('maps men-related names to the man glyph', () => {
    expect(iconForName("Men's Health")).toBe('man-outline');
  });

  it('falls back to a leaf for a name it does not recognise', () => {
    expect(iconForName('Something Unmapped')).toBe('leaf-outline');
  });
});

describe('toUiCategories', () => {
  const uiCategories = toUiCategories(catalog);

  it('drops demo categories and keeps the rest in API order', () => {
    expect(uiCategories.map((c) => c.name)).toEqual([
      'Digestive Care',
      'Eye Care',
      "Women's Health",
    ]);
  });

  // The API is the source of truth for names; nothing may rename or prettify.
  it('passes names through verbatim', () => {
    expect(uiCategories.map((c) => c.name)).not.toContain('Digestive Health');
    expect(uiCategories[2].name).toBe("Women's Health");
  });

  it('keeps the API id, as a string', () => {
    expect(uiCategories.map((c) => c.id)).toEqual(['1', '59', '46']);
  });

  it('rolls a category count up from its own products plus its children', () => {
    expect(uiCategories.find((c) => c.name === 'Digestive Care')?.productCount).toBe(3);
    expect(uiCategories.find((c) => c.name === "Women's Health")?.productCount).toBe(1);
  });

  it('reports zero rather than hiding a category with no products', () => {
    expect(uiCategories.find((c) => c.name === 'Eye Care')?.productCount).toBe(0);
  });

  // No image field: CategoryCard prefers local artwork and falls back to the
  // icon, so setting one here would override the bundled images.
  it('derives an icon and leaves image unset', () => {
    expect(uiCategories[0].icon).toBe('nutrition-outline');
    expect(uiCategories[0].image).toBeUndefined();
  });
});

describe('toUiConcerns', () => {
  const concerns = toUiConcerns(catalog);

  it('flattens sub-services in API order, keeping their own ids', () => {
    expect(concerns.map((c) => `${c.id}:${c.name}`)).toEqual([
      '2:Acidity',
      '3:Constipation',
      '47:Menstrual',
    ]);
  });

  it("does not surface a demo category's sub-services", () => {
    expect(concerns.map((c) => c.name)).not.toContain('Demo Sub');
  });
});

describe('subCategoriesOf', () => {
  it('returns the children of one category', () => {
    expect(subCategoriesOf(catalog, '1').map((c) => c.name)).toEqual(['Acidity', 'Constipation']);
  });

  it('returns nothing for a childless or unknown category', () => {
    expect(subCategoriesOf(catalog, '59')).toEqual([]);
    expect(subCategoriesOf(catalog, '9999')).toEqual([]);
  });
});

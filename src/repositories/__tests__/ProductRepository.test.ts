// ProductRepository's filter/sort/lookup logic is exercised here against the
// REAL productAdapter (toUiProducts/categoryIdsFor) — only the catalog source
// (`catalogStore.getCatalog`) is mocked. This is deliberate: the adapter has
// its own passing test suite (productAdapter.test.ts) that documents exactly
// what it does and doesn't invent (no brand, no rating, no reviewCount, no
// isNewArrival for catalog-derived products — see that file's "field mapping"
// describe block). Re-mocking the adapter here would hide bugs in how
// ProductRepository actually consumes its real output, so several assertions
// below intentionally reflect that "no-op filter/sort" reality instead of an
// idealized one.
import { ProductRepository } from '../ProductRepository';
import { getCatalog } from '../../services/catalog/catalogStore';
import { apiCategory, apiProduct, authCatalog } from '../../services/catalog/__fixtures__/catalog';

jest.mock('../../services/catalog/catalogStore', () => ({ getCatalog: jest.fn() }));

// Raw wire-shaped catalog (ApiCategory[] / ApiProduct[] per src/services/auth/types.ts),
// NOT the already-adapted `Product`/`Category` fixtures in src/test-utils/fixtures.ts.
//
// Category shape: "Digestive Care" (id 1) has one sub-service, "Acidity" (id
// 11) — used to test that getByCategory expands a parent to its children while
// getByConcern does not. "Hair Care" (id 2) has no sub-service.
//
// Prices are chosen so every product lands on a distinct payable price (no
// ties), which keeps the sort-order assertions unambiguous:
//   103=120  101=180  106=190  105=238  102=300  104=500
const FIXTURE_CATALOG = authCatalog(
  [
    apiCategory({
      id: 1,
      name: 'Digestive Care',
      subService: [{ id: 11, name: 'Acidity', description: null }],
    }),
    apiCategory({ id: 2, name: 'Hair Care' }),
  ],
  [
    apiProduct({
      id: 101,
      name: 'Triphala Churna',
      categoryId: 1,
      price: 200,
      discountPercentage: 10, // -> payable price 180
      stockQuantity: 50,
      description: 'Supports digestion and regularity.',
    }),
    apiProduct({
      id: 102,
      name: 'Acidity Relief Tablets',
      categoryId: 11, // sub-service of category 1
      price: 300,
      discountPercentage: 0,
      stockQuantity: 0, // out of stock
      description: 'Fast relief from acidity and heartburn.',
    }),
    apiProduct({
      id: 103,
      name: 'Bhringraj Hair Oil',
      categoryId: 2,
      price: 150,
      discountPercentage: 20, // -> payable price 120
      stockQuantity: 20,
      description: 'Nourishing oil for hair growth.',
    }),
    apiProduct({
      id: 104,
      name: 'Amla Hair Serum',
      categoryId: 2,
      price: 500,
      discountPercentage: 0,
      stockQuantity: 5,
      description: 'Lightweight serum for shine.',
    }),
    apiProduct({
      id: 105,
      name: 'Neem Tulsi Capsules',
      categoryId: 1,
      price: 250,
      discountPercentage: 5, // -> payable price 238 (250 * 0.95, rounded)
      stockQuantity: 15,
      description: 'Immunity support capsules with neem and tulsi.',
    }),
    apiProduct({
      id: 106,
      name: 'Onion Hair Shampoo',
      categoryId: 2,
      price: 190,
      discountPercentage: 0,
      stockQuantity: 25,
      description: 'Reduces hair fall with onion extract.',
    }),
  ]
);

const ALL_IDS = ['101', '102', '103', '104', '105', '106'];

beforeEach(() => {
  (getCatalog as jest.Mock).mockReset();
  (getCatalog as jest.Mock).mockResolvedValue(FIXTURE_CATALOG);
});

function ids(products: { id: string }[]): string[] {
  return products.map((p) => p.id);
}

describe('getApiProducts', () => {
  it('returns the fixture catalog mapped through the real adapter', async () => {
    const result = await ProductRepository.getApiProducts();
    expect(ids(result)).toEqual(ALL_IDS);
    // Faithful passthrough fields per productAdapter's own tests.
    expect(result[0]).toMatchObject({ id: '101', name: 'Triphala Churna', price: 180 });
  });
});

describe('getAll (no filters)', () => {
  it('returns every catalog product', async () => {
    const result = await ProductRepository.getAll();
    expect(ids(result)).toEqual(ALL_IDS);
  });
});

describe('getAll (filters)', () => {
  it('narrows by categoryIds using the literal category id (no sub-service expansion)', async () => {
    const result = await ProductRepository.getAll({ categoryIds: ['1'] });
    // Only products filed directly under '1' — '102' is filed under sub-service
    // '11' and is NOT included here (that expansion only happens in getByCategory).
    expect(ids(result)).toEqual(['101', '105']);
  });

  it('narrows by minPrice', async () => {
    const result = await ProductRepository.getAll({ minPrice: 200 });
    expect(ids(result).sort()).toEqual(['102', '104', '105'].sort());
  });

  it('narrows by maxPrice', async () => {
    const result = await ProductRepository.getAll({ maxPrice: 200 });
    expect(ids(result).sort()).toEqual(['101', '103', '106'].sort());
  });

  it('narrows by inStockOnly, excluding the zero-stock product', async () => {
    const result = await ProductRepository.getAll({ inStockOnly: true });
    expect(ids(result)).not.toContain('102');
    expect(ids(result).sort()).toEqual(['101', '103', '104', '105', '106'].sort());
  });

  it('narrows by onOfferOnly, keeping only products with a positive discount', async () => {
    const result = await ProductRepository.getAll({ onOfferOnly: true });
    expect(ids(result).sort()).toEqual(['101', '103', '105'].sort());
  });

  // productAdapter's own tests show toUiProduct always sets rating: 0 for a
  // catalog product (no rating/review data is ever sent by the API). The
  // filter branch still runs — it's just realistically a "keep everything" or
  // "keep nothing" branch against catalog data, not a meaningful narrowing.
  it('minRating: 0 keeps everything, since every catalog product is adapted with rating 0', async () => {
    const result = await ProductRepository.getAll({ minRating: 0 });
    expect(ids(result)).toEqual(ALL_IDS);
  });

  it('minRating above 0 excludes everything, since no catalog product ever gets a real rating', async () => {
    const result = await ProductRepository.getAll({ minRating: 1 });
    expect(result).toEqual([]);
  });

  // productAdapter never invents a brand for a catalog product (ui.brand is
  // always ''), so filtering catalog data by brand is realistically a no-op
  // that returns nothing — there is no brand value it could ever match.
  it('brands filter returns nothing, since catalog products never carry a brand', async () => {
    const result = await ProductRepository.getAll({ brands: ['Himalaya'] });
    expect(result).toEqual([]);
  });
});

describe('getAll (sort)', () => {
  it('price_low_high orders ascending by the real payable price', async () => {
    const result = await ProductRepository.getAll(undefined, 'price_low_high');
    expect(ids(result)).toEqual(['103', '101', '106', '105', '102', '104']);
  });

  it('price_high_low orders descending by the real payable price', async () => {
    const result = await ProductRepository.getAll(undefined, 'price_high_low');
    expect(ids(result)).toEqual(['104', '102', '105', '106', '101', '103']);
  });

  // productAdapter always sets reviewCount: 0, rating: 0, and never sets
  // isNewArrival at all for a catalog product, so 'popularity'/'rating'/'newest'
  // all sort on an identical key for every item. Array.sort is stable, so the
  // REAL, observed behavior is a no-op that preserves catalog order — not a
  // meaningful reordering. These tests lock in that real behavior.
  it('popularity is a no-op (every catalog product has reviewCount 0)', async () => {
    const result = await ProductRepository.getAll(undefined, 'popularity');
    expect(ids(result)).toEqual(ALL_IDS);
  });

  it('rating is a no-op (every catalog product has rating 0)', async () => {
    const result = await ProductRepository.getAll(undefined, 'rating');
    expect(ids(result)).toEqual(ALL_IDS);
  });

  it('newest is a no-op (no catalog product is ever flagged isNewArrival)', async () => {
    const result = await ProductRepository.getAll(undefined, 'newest');
    expect(ids(result)).toEqual(ALL_IDS);
  });
});

describe('getById', () => {
  it('finds a product by id', async () => {
    const result = await ProductRepository.getById('103');
    expect(result?.name).toBe('Bhringraj Hair Oil');
  });

  it('resolves undefined for an unknown id', async () => {
    await expect(ProductRepository.getById('unknown')).resolves.toBeUndefined();
  });
});

describe('getByCategory', () => {
  it('matches a top-level category id plus its sub-service ids', async () => {
    // '1' (Digestive Care) expands to ['1', '11'] (its 'Acidity' sub-service),
    // so '102' (filed under '11') must show up here even though it wouldn't
    // for a plain categoryIds filter in getAll().
    const result = await ProductRepository.getByCategory('1');
    expect(ids(result)).toEqual(['101', '102', '105']);
  });

  it('matches a childless category by its own id only', async () => {
    const result = await ProductRepository.getByCategory('2');
    expect(ids(result)).toEqual(['103', '104', '106']);
  });

  it('applies filters and sort on top of the category match', async () => {
    const result = await ProductRepository.getByCategory('1', undefined, 'price_low_high');
    expect(ids(result)).toEqual(['101', '105', '102']);
  });
});

describe('getByConcern', () => {
  it('matches only the exact sub-service id', async () => {
    const result = await ProductRepository.getByConcern('11');
    expect(ids(result)).toEqual(['102']);
  });

  it('does NOT expand a parent category id the way getByCategory does', async () => {
    // Querying the parent id '1' as a concern must not pull in '102', which is
    // filed under the '11' sub-service — concerns match exact ids only.
    const result = await ProductRepository.getByConcern('1');
    expect(ids(result)).toEqual(['101', '105']);
    expect(ids(result)).not.toContain('102');
  });
});

describe('getRelated', () => {
  it('returns other products sharing the same categoryId, excluding itself', async () => {
    const result = await ProductRepository.getRelated('103');
    expect(ids(result)).toEqual(['104', '106']);
  });

  it('respects the limit', async () => {
    const result = await ProductRepository.getRelated('103', 1);
    expect(ids(result)).toEqual(['104']);
  });

  it('returns [] for an unknown product id', async () => {
    await expect(ProductRepository.getRelated('unknown')).resolves.toEqual([]);
  });
});

describe('getFrequentlyBoughtTogether', () => {
  it('returns other products regardless of category, excluding itself', async () => {
    const result = await ProductRepository.getFrequentlyBoughtTogether('101', 2);
    expect(ids(result)).toEqual(['102', '103']);
  });

  it('respects the limit', async () => {
    const result = await ProductRepository.getFrequentlyBoughtTogether('101', 1);
    expect(ids(result)).toEqual(['102']);
  });

  it('returns [] for an unknown product id', async () => {
    await expect(ProductRepository.getFrequentlyBoughtTogether('unknown')).resolves.toEqual([]);
  });
});

describe('search', () => {
  it('matches the name case-insensitively', async () => {
    const result = await ProductRepository.search('TRIPHALA');
    expect(ids(result)).toEqual(['101']);
  });

  it('matches the description case-insensitively (catalog products carry no brand/tags to match on)', async () => {
    const result = await ProductRepository.search('SHINE');
    expect(ids(result)).toEqual(['104']);
  });

  it('returns [] for a blank/whitespace-only query without needing getCatalog to resolve anything', async () => {
    const result = await ProductRepository.search('   ');
    expect(result).toEqual([]);
    expect(getCatalog).not.toHaveBeenCalled();
  });
});

describe('getBrands', () => {
  // productAdapter's own tests confirm ui.brand is always '' for a catalog
  // product ("does not invent a brand"); ProductRepository.getBrands() drops
  // falsy values, so the real, observed behavior is an empty list.
  it('returns an empty array, since no catalog product ever carries a brand', async () => {
    await expect(ProductRepository.getBrands()).resolves.toEqual([]);
  });
});

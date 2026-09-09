import { CategoryRepository } from '../CategoryRepository';
import { getCatalog } from '../../services/catalog/catalogStore';
import { apiCategory, apiProduct, authCatalog } from '../../services/catalog/__fixtures__/catalog';

// Only the catalog source is mocked. toUiCategories/toUiConcerns (from the
// real categoryAdapter) run unmocked, so the adaptation itself is exercised
// for real here and not re-tested in isolation (that's categoryAdapter's own
// test file's job).
jest.mock('../../services/catalog/catalogStore', () => ({ getCatalog: jest.fn() }));

const mockedGetCatalog = getCatalog as jest.Mock;

/**
 * A small catalog in the RAW API wire shape (ApiCategory[] / ApiProduct[]):
 * three categories, one with a subService child, and products split across
 * the parent and children so getAll's roll-up and getConcerns' flattening
 * both have something real to do.
 */
const catalog = authCatalog(
  [
    apiCategory({
      id: 1,
      name: 'Digestive Care',
      subService: [{ id: 2, name: 'Acidity', description: null }],
    }),
    apiCategory({ id: 59, name: 'Eye Care' }),
    apiCategory({
      id: 46,
      name: "Women's Health",
      subService: [{ id: 47, name: 'Menstrual', description: null }],
    }),
  ],
  [
    apiProduct({ id: 10, categoryId: 1 }),
    apiProduct({ id: 11, categoryId: 2 }),
    apiProduct({ id: 12, categoryId: 47 }),
  ]
);

// createCategory/updateCategory/deleteCategory are admin-only and operate on a
// separate in-memory array unrelated to the catalog above — out of scope, and
// nothing tested here mutates shared state, so no jest.resetModules() dance is
// needed for this file.
describe('CategoryRepository', () => {
  beforeEach(() => {
    mockedGetCatalog.mockResolvedValue(catalog);
  });

  describe('getAll', () => {
    it('returns categories adapted from the catalog, in API order', async () => {
      const result = await CategoryRepository.getAll();
      expect(result.map((c) => c.name)).toEqual(['Digestive Care', 'Eye Care', "Women's Health"]);
    });

    it('rolls a category count up from its own products plus its children', async () => {
      const result = await CategoryRepository.getAll();
      expect(result.find((c) => c.name === 'Digestive Care')?.productCount).toBe(2);
      expect(result.find((c) => c.name === 'Eye Care')?.productCount).toBe(0);
      expect(result.find((c) => c.name === "Women's Health")?.productCount).toBe(1);
    });
  });

  describe('getById', () => {
    it('finds a category by id', async () => {
      const result = await CategoryRepository.getById('59');
      expect(result?.name).toBe('Eye Care');
    });

    it('resolves undefined for an unknown id', async () => {
      await expect(CategoryRepository.getById('9999')).resolves.toBeUndefined();
    });
  });

  describe('getConcerns', () => {
    it('returns sub-service-derived concerns, flattened in API order', async () => {
      const result = await CategoryRepository.getConcerns();
      expect(result.map((c) => `${c.id}:${c.name}`)).toEqual(['2:Acidity', '47:Menstrual']);
    });
  });
});

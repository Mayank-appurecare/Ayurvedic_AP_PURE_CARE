// catalogStore keeps its state in module-level `let cached`/`hydrated`
// variables that live for as long as the module stays loaded — NOT reset the
// way component state would be. So every test below forces a completely
// fresh module instance (and a fresh in-memory AsyncStorage) via
// `jest.resetModules()` + a dynamic `require()` in `beforeEach`, instead of a
// static top-of-file `import`, which would keep a single stale instance alive
// for the whole file and leak `cached`/`hydrated` across tests.
//
// It is safe to statically import type-only and pure-data things (the
// `AuthCatalog` type, the fixture builders, `FALLBACK_CATALOG`) because none
// of those hold any mutable module state of their own.

import { AuthCatalog } from '../../auth/types';
import { FALLBACK_CATALOG } from '../../../data/fallbackCatalog';
import { apiCategory, apiProduct, authCatalog } from '../__fixtures__/catalog';

const STORAGE_KEY = '@ojas_ayurveda/session_catalog';

const customCatalog: AuthCatalog = authCatalog(
  [apiCategory({ id: 1, name: 'Custom Category' })],
  [apiProduct({ id: 1, categoryId: 1, name: 'Custom Product' })]
);

type CatalogStoreModule = typeof import('../catalogStore');
type AsyncStorageModule = typeof import('@react-native-async-storage/async-storage').default;

let catalogStore: CatalogStoreModule;
let AsyncStorage: AsyncStorageModule;

beforeEach(() => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a dynamic require() so jest.resetModules() actually produces a fresh module instance
  catalogStore = require('../catalogStore');
  // The jest mock (registered in jest.setup.js, which survives resetModules —
  // only the module *instance* it returns is fresh each time) is a plain
  // CommonJS module (`module.exports = asMock`, no `__esModule` marker), so a
  // raw `require()` here returns it directly with no `.default` wrapper. The
  // `?? required` fallback keeps this working even if that ever changes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a dynamic require() so jest.resetModules() actually produces a fresh module instance
  const required = require('@react-native-async-storage/async-storage');
  AsyncStorage = required.default ?? required;
});

describe('getCatalog', () => {
  it('returns FALLBACK_CATALOG when AsyncStorage has nothing stored', async () => {
    const catalog = await catalogStore.getCatalog();
    expect(catalog).toEqual(FALLBACK_CATALOG);
  });

  it('returns a persisted catalog instead of the fallback when AsyncStorage was seeded', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(customCatalog));

    const catalog = await catalogStore.getCatalog();

    expect(catalog).toEqual(customCatalog);
    expect(catalog).not.toBe(FALLBACK_CATALOG);
  });

  it('only reads AsyncStorage once, no matter how many times it is called (hydrated guard)', async () => {
    await catalogStore.getCatalog();
    await catalogStore.getCatalog();
    await catalogStore.getCatalog();

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it('falls back to FALLBACK_CATALOG when the stored value is corrupt JSON, instead of throwing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not json{');

    await expect(catalogStore.getCatalog()).resolves.toEqual(FALLBACK_CATALOG);
  });
});

describe('setCatalog', () => {
  it('makes an immediately-following getCatalog() return the new catalog, without a prior getCatalog() call', async () => {
    await catalogStore.setCatalog(customCatalog);

    const catalog = await catalogStore.getCatalog();

    expect(catalog).toEqual(customCatalog);
  });

  it('persists the catalog to AsyncStorage under the session-catalog key as JSON', async () => {
    await catalogStore.setCatalog(customCatalog);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(customCatalog));
  });

  it('removes the AsyncStorage key (not setItem) when passed null, and getCatalog() reverts to the fallback', async () => {
    await catalogStore.setCatalog(customCatalog);
    await catalogStore.setCatalog(null);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1); // only the earlier non-null call

    const catalog = await catalogStore.getCatalog();
    expect(catalog).toEqual(FALLBACK_CATALOG);
  });
});

describe('clearCatalog', () => {
  it('behaves exactly like setCatalog(null): removes the key and reverts getCatalog() to the fallback', async () => {
    await catalogStore.setCatalog(customCatalog);
    await catalogStore.clearCatalog();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);

    const catalog = await catalogStore.getCatalog();
    expect(catalog).toEqual(FALLBACK_CATALOG);
  });
});

describe('hasApiCatalog', () => {
  it('resolves false before any setCatalog call', async () => {
    await expect(catalogStore.hasApiCatalog()).resolves.toBe(false);
  });

  it('resolves true after setCatalog() with a non-null catalog', async () => {
    await catalogStore.setCatalog(customCatalog);

    await expect(catalogStore.hasApiCatalog()).resolves.toBe(true);
  });

  it('resolves false again after clearCatalog()', async () => {
    await catalogStore.setCatalog(customCatalog);
    await catalogStore.clearCatalog();

    await expect(catalogStore.hasApiCatalog()).resolves.toBe(false);
  });
});

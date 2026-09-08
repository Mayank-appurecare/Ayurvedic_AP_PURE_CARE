import { categoryIdsFor, toUiProduct, toUiProducts } from '../productAdapter';
import { apiCategory, apiProduct, authCatalog } from '../__fixtures__/catalog';

describe('toUiProduct pricing', () => {
  // The API sends `price` plus `discountPercentage` and no MRP. `price` is read
  // as the LIST price so the badge and the strike-through agree. If the backend
  // ever starts sending price net of discount, these are the tests to change.
  it('treats price as the list price and derives the payable price', () => {
    const ui = toUiProduct(apiProduct({ price: 195, discountPercentage: 12 }));
    expect(ui.mrp).toBe(195);
    expect(ui.price).toBe(172); // 195 * 0.88 = 171.6, rounded
    expect(ui.discountPercent).toBe(12);
  });

  it('leaves the price alone when there is no discount', () => {
    const ui = toUiProduct(apiProduct({ price: 250, discountPercentage: 0 }));
    expect(ui.price).toBe(250);
    expect(ui.mrp).toBe(250);
  });

  it('clamps a nonsensical discount instead of producing a negative price', () => {
    expect(toUiProduct(apiProduct({ price: 100, discountPercentage: 150 })).price).toBe(0);
    expect(toUiProduct(apiProduct({ price: 100, discountPercentage: -20 })).price).toBe(100);
  });

  it('never reports negative stock', () => {
    expect(toUiProduct(apiProduct({ stockQuantity: -5 })).stock).toBe(0);
  });
});

describe('toUiProduct field mapping', () => {
  it('splits composition into ingredients', () => {
    const ui = toUiProduct(apiProduct({ composition: 'Haritaki, Mridvika , Vidanga,, Madhuka' }));
    expect(ui.ingredients).toEqual(['Haritaki', 'Mridvika', 'Vidanga', 'Madhuka']);
  });

  it('leaves ingredients empty when the API sends no composition', () => {
    expect(toUiProduct(apiProduct({ composition: null })).ingredients).toEqual([]);
  });

  // The API sends none of these, and the UI has its own empty states for them.
  // Anything other than these values would be invented data.
  it('does not invent a brand, image, rating or review count', () => {
    const ui = toUiProduct(apiProduct());
    expect(ui.brand).toBe('');
    expect(ui.images).toEqual([]);
    expect(ui.rating).toBe(0);
    expect(ui.reviewCount).toBe(0);
  });

  it('builds productInfo rows only from fields the API actually sent', () => {
    const rows = toUiProduct(
      apiProduct({ sku: 'AY-DIG-008', packSize: '450 ml', dosageForm: 'Arishta', dosha: null })
    ).productInfo;
    expect(rows).toEqual([
      { label: 'SKU', value: 'AY-DIG-008' },
      { label: 'Pack Size', value: '450 ml' },
      { label: 'Dosage Form', value: 'Arishta' },
    ]);
  });

  it('flags a prescription-only product', () => {
    const rows = toUiProduct(apiProduct({ prescriptionRequired: true })).productInfo;
    expect(rows).toContainEqual({ label: 'Prescription', value: 'Required' });
  });

  // ProductCard and ProductDetailScreen both index variants[0] when adding to
  // the cart, so an empty array would crash them.
  it('always produces one variant, labelled with the API pack size', () => {
    const ui = toUiProduct(apiProduct({ id: 8, packSize: '100 g', price: 200, stockQuantity: 7 }));
    expect(ui.variants).toHaveLength(1);
    expect(ui.variants[0]).toEqual({
      id: '8-default',
      label: '100 g',
      price: 200,
      mrp: 200,
      stock: 7,
    });
  });

  it('labels the variant "Standard" when the API sends no pack size', () => {
    expect(toUiProduct(apiProduct({ packSize: null })).variants[0].label).toBe('Standard');
  });
});

describe('toUiProducts', () => {
  const catalog = authCatalog(
    [
      apiCategory({ id: 1, name: 'Digestive Care' }),
      apiCategory({
        id: 70,
        name: 'Digestive Care Demo',
        subService: [{ id: 71, name: 'Demo Sub', description: null }],
      }),
    ],
    [
      apiProduct({ id: 1, name: 'Abhayarishta', categoryId: 1 }),
      apiProduct({ id: 2, name: 'Triphala Churna Demo', categoryId: 70 }),
      apiProduct({ id: 3, name: 'Nested Demo Product', categoryId: 71 }),
    ]
  );

  // toUiCategories already hides demo categories, but products reference a
  // category id directly, so without this filter a seed product would still
  // reach the Home rail, the all-products grid and search.
  it('drops products filed under a demo category or its sub-services', () => {
    expect(toUiProducts(catalog).map((p) => p.name)).toEqual(['Abhayarishta']);
  });

  it('keeps the API order for the products it does return', () => {
    const ordered = authCatalog(
      [apiCategory({ id: 1 })],
      [
        apiProduct({ id: 3, name: 'Third', categoryId: 1 }),
        apiProduct({ id: 1, name: 'First', categoryId: 1 }),
      ]
    );
    expect(toUiProducts(ordered).map((p) => p.name)).toEqual(['Third', 'First']);
  });
});

describe('categoryIdsFor', () => {
  const catalog = authCatalog([
    apiCategory({
      id: 1,
      name: 'Digestive Care',
      subService: [
        { id: 2, name: 'Acidity', description: null },
        { id: 3, name: 'Constipation', description: null },
      ],
    }),
    apiCategory({ id: 59, name: 'Eye Care' }),
  ]);

  // Products carry the most specific id, so matching a top-level category by
  // equality alone would return nothing.
  it('expands a top-level category to itself plus its sub-services', () => {
    expect(categoryIdsFor(catalog, '1')).toEqual(['1', '2', '3']);
  });

  it('returns just the id for a childless category', () => {
    expect(categoryIdsFor(catalog, '59')).toEqual(['59']);
  });

  it('falls back to the requested id when the category is unknown', () => {
    expect(categoryIdsFor(catalog, '9999')).toEqual(['9999']);
  });
});

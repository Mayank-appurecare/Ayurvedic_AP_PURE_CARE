// Regenerates src/data/fallbackCatalog.ts from a captured verify response.
//
// Unlike the first version, this one has the WHOLE payload, so every field is
// copied verbatim from the API instead of being left null.

import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2];
const OUT = process.argv[3];

const { data } = JSON.parse(readFileSync(SRC, 'utf8'));
const categories = data.categories ?? [];
const products = data.productList ?? [];

const lit = (v) => (v === null || v === undefined ? 'null' : JSON.stringify(v));

const catLines = categories
  .map((c) => {
    const head = [
      `    id: ${c.id},`,
      `    name: ${lit(c.name)},`,
      `    description: ${lit(c.description ?? null)},`,
    ];
    const subs = c.subService ?? [];
    if (!subs.length) return ['  {', ...head, '  },'].join('\n');
    return [
      '  {',
      ...head,
      '    subService: [',
      ...subs.map(
        (s) =>
          `      { id: ${s.id}, name: ${lit(s.name)}, description: ${lit(s.description ?? null)} },`
      ),
      '    ],',
      '  },',
    ].join('\n');
  })
  .join('\n');

// Column order matches the ApiProduct interface so the table reads consistently.
const prodLines = products
  .map((p) =>
    [
      '  {',
      `    id: ${p.id},`,
      `    sku: ${lit(p.sku)},`,
      `    name: ${lit(p.name)},`,
      `    categoryId: ${p.categoryId},`,
      `    description: ${lit(p.description)},`,
      `    classicalReference: ${lit(p.classicalReference)},`,
      `    composition: ${lit(p.composition)},`,
      `    dosageForm: ${lit(p.dosageForm)},`,
      `    dosha: ${lit(p.dosha)},`,
      `    formulationClass: ${lit(p.formulationClass)},`,
      `    packSize: ${lit(p.packSize)},`,
      `    ayushLicenceNo: ${lit(p.ayushLicenceNo)},`,
      `    price: ${p.price},`,
      `    discountPercentage: ${p.discountPercentage},`,
      `    stockQuantity: ${p.stockQuantity},`,
      `    prescriptionRequired: ${!!p.prescriptionRequired},`,
      `    scheduleE1: ${!!p.scheduleE1},`,
      `    containsHeavyMetals: ${!!p.containsHeavyMetals},`,
      '  },',
    ].join('\n')
  )
  .join('\n');

const demo = categories.filter((c) => /\bdemo\b/i.test(c.name)).map((c) => c.name);

const file = `// Bundled catalog used when the app has no API catalog yet — i.e. a guest, or
// anyone who has not signed in. It mirrors the real backend payload so the app
// looks and behaves the same before and after sign-in.
//
// PROVENANCE: copied verbatim from a successful POST /api/auth/otp/verify
// response. Every field here is the value the backend sent — nothing is
// derived, prettified or invented. ${categories.length} categories, ${products.length} products.
//
// The payload includes the backend's own seed row${demo.length === 1 ? '' : 's'}${demo.length ? ` (${demo.map((d) => `"${d}"`).join(', ')})` : ''}, kept here on
// purpose so this file stays a faithful copy of the API. \`categoryAdapter\`
// filters demo rows out of the customer UI, which is the single place that
// decision belongs.
//
// TO REFRESH: capture a verify response and re-run scripts/gen-fallback.mjs
// against it. Do not hand-edit — a hand-edited row silently stops matching the
// backend, and this file is what a guest sees.

import { ApiCategory, ApiProduct, AuthCatalog } from '../services/auth/types';

const categories: ApiCategory[] = [
${catLines}
];

const products: ApiProduct[] = [
${prodLines}
];

export const FALLBACK_CATALOG: AuthCatalog = { categories, products };
`;

writeFileSync(OUT, file);
console.log(`wrote ${OUT}`);
console.log(
  `  categories: ${categories.length}${demo.length ? ` (incl. ${demo.length} demo: ${demo.join(', ')})` : ''}`
);
console.log(`  products:   ${products.length}`);
console.log(`  in stock:   ${products.filter((p) => p.stockQuantity > 0).length}`);
console.log(`  size:       ${(readFileSync(OUT).length / 1024).toFixed(1)} KB`);

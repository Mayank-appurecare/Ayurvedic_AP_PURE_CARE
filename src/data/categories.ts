import { Category, Concern } from '../types';
import { iconForName } from '../services/catalog/categoryAdapter';

// OFFLINE / GUEST FALLBACK CATEGORIES
//
// The real catalog arrives with the auth token, so a guest — or anyone opening
// the app before signing in — has no API categories at all. This list stands in
// for them.
//
// It mirrors the backend's own 18 categories: same names, same ids, same order,
// so the app looks identical before and after sign-in. Names are copied verbatim
// from the API; the API stays the source of truth once a session exists.
//
// NOTE: no `image` field on purpose. `CategoryCard` prefers `category.image`
// (a remote URL) over the bundled artwork, so setting one here would hide the
// AP Pure Care artwork. Leaving it undefined lets `categoryImages.ts` supply
// the picture, exactly as it does for API categories.
//
// `icon` is derived with the same `iconForName` the API adapter uses, so the two
// paths can never drift apart.
//
// `productCount` counts the bundled sample products in `products.ts`. Categories
// with no sample product show 0 — honest, rather than an invented number.

const fallback = (id: string, name: string, productCount: number, description: string): Category => ({
  id,
  name,
  icon: iconForName(name),
  description,
  productCount,
});

export const categories: Category[] = [
  fallback('62', 'Baby & Kids', 0, 'Gentle Ayurvedic care for babies and children.'),
  fallback('11', 'Diabetes Care', 0, 'Support healthy blood sugar the natural way.'),
  fallback('1', 'Digestive Care', 2, 'Happy gut, healthy you — naturally.'),
  fallback('61', 'Ear Care', 0, 'Soothing herbal care for ear health.'),
  fallback('59', 'Eye Care', 0, 'Herbal support for healthy vision.'),
  fallback('31', 'Hair Care', 2, 'Nourish your hair the natural way.'),
  fallback('27', 'Heart Health', 0, 'Ayurvedic support for a healthy heart.'),
  fallback('7', 'Immunity & Wellness', 4, 'Build natural resistance with time-tested formulations.'),
  fallback('14', 'Joint & Bone Care', 2, 'Ease joint discomfort and support strong bones.'),
  fallback('56', 'Kidney & Urinary', 0, 'Natural support for kidneys and urinary tract.'),
  fallback('42', "Men's Health", 1, 'Vitality and stamina support for men.'),
  fallback('60', 'Oral Care', 0, 'Natural care for strong teeth and healthy gums.'),
  fallback('66', 'Pain Relief', 0, 'Relieve pain naturally with Ayurvedic formulations.'),
  fallback('18', 'Respiratory Care', 0, 'Ayurvedic care for free and healthy breath.'),
  fallback('36', 'Skin Care', 4, 'Radiant skin through herbal skincare rituals.'),
  fallback('23', 'Stress, Sleep & Mind', 2, 'Calm the mind and rest better, naturally.'),
  fallback('52', 'Weight Management', 0, 'Support healthy weight and metabolism.'),
  fallback('46', "Women's Health", 2, 'Holistic wellness formulated for women.'),
];

// Concerns are unchanged: these ids are referenced by `products.ts`
// (`concernIds`), so renaming them would break "Shop by Concern" for guests.
// Once signed in, the API's own sub-services replace this list.
export const concerns: Concern[] = [
  { id: 'concern-immunity', name: 'Immunity', icon: 'shield-checkmark-outline' },
  { id: 'concern-digestion', name: 'Digestion', icon: 'nutrition-outline' },
  { id: 'concern-hairfall', name: 'Hair Fall', icon: 'cut-outline' },
  { id: 'concern-skin-glow', name: 'Skin Glow', icon: 'sparkles-outline' },
  { id: 'concern-stress', name: 'Stress Relief', icon: 'moon-outline' },
  { id: 'concern-sleep', name: 'Better Sleep', icon: 'bed-outline' },
  { id: 'concern-joint-pain', name: 'Joint Pain', icon: 'body-outline' },
  { id: 'concern-energy', name: 'Energy & Stamina', icon: 'flash-outline' },
  { id: 'concern-weight', name: 'Weight Management', icon: 'barbell-outline' },
  { id: 'concern-detox', name: 'Detox', icon: 'water-outline' },
];

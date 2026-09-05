// Local AP Pure Care artwork for each API category.
//
// WHY A STATIC MAP: React Native's bundler resolves `require()` at build time,
// so an image path can never be built dynamically (`require(\`./\${name}.png\`)`
// does not work). Every asset therefore has to be listed literally.
//
// The API is still the source of truth for a category's id, name, description
// and product count — this module only supplies the picture, which the API does
// not send. Nothing here renames or reorders anything.
//
// Lookup order: API category id first (stable, e.g. 31 = Hair Care), then a
// normalized name as a fallback in case ids ever change.

import { ImageSourcePropType } from 'react-native';

/**
 * Lower-cases and strips everything that varies between spellings — spaces,
 * punctuation, apostrophes, ampersands — so "Women's Health", "Womens Health"
 * and "WOMEN HEALTH" all collapse to the same key.
 */
export function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * The bundled artwork, declared once.
 *
 * Both lookup tables below point at THIS object rather than at each other. An
 * earlier version had the name table borrow its values from the id table, so
 * deleting one id row silently turned the matching name row into `undefined`
 * and that category lost its picture with nothing to show for it.
 */
const ART = {
  baby_kids: require('../../../assets/images/categories/baby_kids.png'),
  diabetes_care: require('../../../assets/images/categories/diabetes_care.png'),
  digestive_care: require('../../../assets/images/categories/digestive_care.png'),
  ear_care: require('../../../assets/images/categories/ear_care.png'),
  eye_care: require('../../../assets/images/categories/eye_care.png'),
  hair_care: require('../../../assets/images/categories/hair_care.png'),
  heart_health: require('../../../assets/images/categories/heart_health.png'),
  immunity_wellness: require('../../../assets/images/categories/immunity_wellness.png'),
  joint_bone_care: require('../../../assets/images/categories/joint_bone_care.png'),
  kidney_urinary: require('../../../assets/images/categories/kidney_urinary.png'),
  mens_health: require('../../../assets/images/categories/mens_health.png'),
  oral_care: require('../../../assets/images/categories/oral_care.png'),
  pain_relief: require('../../../assets/images/categories/pain_relief.png'),
  respiratory_care: require('../../../assets/images/categories/respiratory_care.png'),
  skin_care: require('../../../assets/images/categories/skin_care.png'),
  stress_sleep_mind: require('../../../assets/images/categories/stress_sleep_mind.png'),
  weight_management: require('../../../assets/images/categories/weight_management.png'),
  womens_health: require('../../../assets/images/categories/womens_health.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Keyed by the API's own category id. */
const BY_ID: Record<string, ImageSourcePropType> = {
  '62': ART.baby_kids,
  '11': ART.diabetes_care,
  '1': ART.digestive_care,
  '61': ART.ear_care,
  '59': ART.eye_care,
  '31': ART.hair_care,
  '27': ART.heart_health,
  '7': ART.immunity_wellness,
  '14': ART.joint_bone_care,
  '56': ART.kidney_urinary,
  '42': ART.mens_health,
  '60': ART.oral_care,
  '66': ART.pain_relief,
  '18': ART.respiratory_care,
  '36': ART.skin_care,
  '23': ART.stress_sleep_mind,
  '52': ART.weight_management,
  '46': ART.womens_health,
};

/**
 * Keyed by normalized category name, used when an id is unknown. Keys are the
 * normalized form of the API's display names — the display strings themselves
 * are never altered.
 */
const BY_NAME: Record<string, ImageSourcePropType> = {
  [normalizeCategoryName('Baby & Kids')]: ART.baby_kids,
  [normalizeCategoryName('Diabetes Care')]: ART.diabetes_care,
  [normalizeCategoryName('Digestive Care')]: ART.digestive_care,
  [normalizeCategoryName('Ear Care')]: ART.ear_care,
  [normalizeCategoryName('Eye Care')]: ART.eye_care,
  [normalizeCategoryName('Hair Care')]: ART.hair_care,
  [normalizeCategoryName('Heart Health')]: ART.heart_health,
  [normalizeCategoryName('Immunity & Wellness')]: ART.immunity_wellness,
  [normalizeCategoryName('Joint & Bone Care')]: ART.joint_bone_care,
  [normalizeCategoryName('Kidney & Urinary')]: ART.kidney_urinary,
  [normalizeCategoryName("Men's Health")]: ART.mens_health,
  [normalizeCategoryName('Oral Care')]: ART.oral_care,
  [normalizeCategoryName('Pain Relief')]: ART.pain_relief,
  [normalizeCategoryName('Respiratory Care')]: ART.respiratory_care,
  [normalizeCategoryName('Skin Care')]: ART.skin_care,
  [normalizeCategoryName('Stress, Sleep & Mind')]: ART.stress_sleep_mind,
  [normalizeCategoryName('Weight Management')]: ART.weight_management,
  [normalizeCategoryName("Women's Health")]: ART.womens_health,
};

/**
 * The artwork for a category, or `undefined` when there is none.
 *
 * Deliberately returns `undefined` rather than a generic stand-in: a category
 * with no artwork keeps the icon it already had, so a wrong category's picture
 * can never be shown.
 */
export function categoryImageFor(id: string, name: string): ImageSourcePropType | undefined {
  return BY_ID[id] ?? BY_NAME[normalizeCategoryName(name)];
}

/** Number of categories that have artwork. Used by tooling/tests. */
export const CATEGORY_IMAGE_COUNT = Object.keys(BY_ID).length;

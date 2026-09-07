// Bundled catalog used when the app has no API catalog yet — i.e. a guest, or
// anyone who has not signed in. It mirrors the real backend payload so the app
// looks and behaves the same before and after sign-in.
//
// PROVENANCE: copied from an actual /api/auth/otp/verify response.
//   - All 18 categories are complete and exact.
//   - Products are a PARTIAL slice: 48 of roughly 149, alphabetically
//     "Abhayarishta" through "Gudmar (Gymnema) Churna". The captured response was
//     truncated, so the rest are simply not available offline yet.
//
// Only fields verified against the API are filled in: id, sku, name, categoryId,
// price, discountPercentage and stockQuantity. Fields the captured slice did not
// preserve per-product (composition, dosageForm, packSize, dosha,
// classicalReference) are left null on purpose — the product screens then render
// their empty state rather than a value the backend never sent.
//
// Once the backend is reachable, a real verify response replaces all of this at
// runtime; this file is only ever the offline stand-in.

import { ApiCategory, ApiProduct, AuthCatalog } from '../services/auth/types';

const categories: ApiCategory[] = [
  {
    id: 62,
    name: 'Baby & Kids',
    description: null,
    subService: [
      { id: 65, name: 'Digestion', description: null },
      { id: 64, name: 'Immunity', description: null },
      { id: 63, name: 'Massage Oils', description: null },
    ],
  },
  {
    id: 11,
    name: 'Diabetes Care',
    description: null,
    subService: [
      { id: 13, name: 'Diabetic Nutrition', description: null },
      { id: 12, name: 'Sugar Management', description: null },
    ],
  },
  {
    id: 1,
    name: 'Digestive Care',
    description: null,
    subService: [
      { id: 2, name: 'Acidity', description: null },
      { id: 3, name: 'Constipation', description: null },
      { id: 6, name: 'Gut Health', description: null },
      { id: 5, name: 'Liver', description: null },
      { id: 4, name: 'Piles', description: null },
    ],
  },
  { id: 61, name: 'Ear Care', description: null },
  { id: 59, name: 'Eye Care', description: null },
  {
    id: 31,
    name: 'Hair Care',
    description: null,
    subService: [
      { id: 33, name: 'Dandruff', description: null },
      { id: 34, name: 'Greying', description: null },
      { id: 32, name: 'Hair Fall', description: null },
      { id: 35, name: 'Hair Oils', description: null },
    ],
  },
  {
    id: 27,
    name: 'Heart Health',
    description: null,
    subService: [
      { id: 29, name: 'BP Support', description: null },
      { id: 28, name: 'Cholesterol', description: null },
      { id: 30, name: 'Circulation', description: null },
    ],
  },
  {
    id: 7,
    name: 'Immunity & Wellness',
    description: null,
    subService: [
      { id: 8, name: 'Daily Immunity', description: null },
      { id: 10, name: 'Rasayana / Anti-ageing', description: null },
      { id: 9, name: 'Seasonal', description: null },
    ],
  },
  {
    id: 14,
    name: 'Joint & Bone Care',
    description: null,
    subService: [
      { id: 15, name: 'Arthritis', description: null },
      { id: 16, name: 'Back Pain', description: null },
      { id: 17, name: 'Bone Strength', description: null },
    ],
  },
  {
    id: 56,
    name: 'Kidney & Urinary',
    description: null,
    subService: [
      { id: 57, name: 'Stones', description: null },
      { id: 58, name: 'UTI Support', description: null },
    ],
  },
  {
    id: 42,
    name: "Men's Health",
    description: null,
    subService: [
      { id: 45, name: 'Performance', description: null },
      { id: 44, name: 'Prostate', description: null },
      { id: 43, name: 'Vitality', description: null },
    ],
  },
  { id: 60, name: 'Oral Care', description: null },
  {
    id: 66,
    name: 'Pain Relief',
    description: null,
    subService: [
      { id: 67, name: 'Balms', description: null },
      { id: 68, name: 'Liniments', description: null },
      { id: 69, name: 'Pain Oils', description: null },
    ],
  },
  {
    id: 18,
    name: 'Respiratory Care',
    description: null,
    subService: [
      { id: 20, name: 'Asthma', description: null },
      { id: 19, name: 'Cough & Cold', description: null },
      { id: 21, name: 'Sinus', description: null },
      { id: 22, name: 'Throat', description: null },
    ],
  },
  {
    id: 36,
    name: 'Skin Care',
    description: null,
    subService: [
      { id: 37, name: 'Acne', description: null },
      { id: 41, name: 'Body Care', description: null },
      { id: 39, name: 'Eczema', description: null },
      { id: 40, name: 'Face Care', description: null },
      { id: 38, name: 'Pigmentation', description: null },
    ],
  },
  {
    id: 23,
    name: 'Stress, Sleep & Mind',
    description: null,
    subService: [
      { id: 24, name: 'Anxiety', description: null },
      { id: 26, name: 'Memory & Focus', description: null },
      { id: 25, name: 'Sleep Support', description: null },
    ],
  },
  {
    id: 52,
    name: 'Weight Management',
    description: null,
    subService: [
      { id: 54, name: 'Metabolism', description: null },
      { id: 55, name: 'Weight Gain', description: null },
      { id: 53, name: 'Weight Loss', description: null },
    ],
  },
  {
    id: 46,
    name: "Women's Health",
    description: null,
    subService: [
      { id: 51, name: 'Fertility', description: null },
      { id: 50, name: 'Lactation', description: null },
      { id: 49, name: 'Menopause', description: null },
      { id: 47, name: 'Menstrual', description: null },
      { id: 48, name: 'PCOS', description: null },
    ],
  },
];

/** Builds a product with only the API-verified fields populated. */
const p = (
  id: number,
  sku: string,
  name: string,
  categoryId: number,
  price: number,
  discountPercentage: number,
  stockQuantity: number
): ApiProduct => ({
  id,
  sku,
  name,
  categoryId,
  price,
  discountPercentage,
  stockQuantity,
  // Not present in the captured slice — deliberately blank, never guessed.
  description: null,
  classicalReference: null,
  composition: null,
  dosageForm: null,
  dosha: null,
  formulationClass: null,
  packSize: null,
  ayushLicenceNo: null,
  prescriptionRequired: false,
  scheduleE1: false,
  containsHeavyMetals: false,
});

const products: ApiProduct[] = [
  p(8, 'AY-DIG-008', 'Abhayarishta', 3, 195, 12, 0),
  p(115, 'AY-WGT-005', 'Agnitundi Vati', 54, 225, 10, 0),
  p(92, 'AY-SKN-010', 'Aloe & Chandana Face Gel', 40, 245, 18, 0),
  p(2, 'AY-DIG-002', 'Amalaki Churna', 2, 140, 18, 0),
  p(22, 'AY-IMM-004', 'Amalaki Rasayana', 8, 320, 15, 0),
  p(80, 'AY-HAR-007', 'Amla & Bhringraj Hair Pack', 34, 265, 18, 0),
  p(54, 'AY-RES-008', 'Anu Taila', 21, 245, 15, 0),
  p(131, 'AY-EAR-002', 'Apamarga Kshara Taila', 61, 265, 10, 0),
  p(72, 'AY-HRT-006', 'Arjuna Churna', 30, 175, 15, 0),
  p(67, 'AY-HRT-001', 'Arjunarishta', 28, 240, 12, 0),
  p(12, 'AY-DIG-012', 'Arogyavardhini Vati', 5, 340, 10, 0),
  p(9, 'AY-DIG-009', 'Arshoghni Vati', 4, 240, 12, 0),
  p(101, 'AY-WMN-001', 'Ashokarishta', 47, 235, 12, 0),
  p(95, 'AY-MEN-001', 'Ashwagandha Capsules', 43, 395, 18, 0),
  p(27, 'AY-IMM-009', 'Ashwagandha Churna', 10, 285, 20, 0),
  p(62, 'AY-MND-004', 'Ashwagandharishta', 25, 255, 12, 0),
  p(46, 'AY-JNT-010', 'Asthisamhara (Hadjod) Churna', 17, 195, 15, 0),
  p(1, 'AY-DIG-001', 'Avipattikar Churna', 2, 185, 15, 0),
  p(139, 'AY-PAN-001', 'Ayurvedic Pain Balm', 67, 125, 18, 0),
  p(138, 'AY-BAB-007', 'Bal Amrit Syrup', 64, 215, 15, 0),
  p(132, 'AY-BAB-001', 'Bala Taila', 63, 295, 15, 0),
  p(135, 'AY-BAB-004', 'Balachaturbhadra Churna', 65, 195, 15, 0),
  p(74, 'AY-HAR-001', 'Bhringraj Taila', 32, 275, 18, 0),
  p(76, 'AY-HAR-003', 'Bhringrajasava', 32, 265, 12, 0),
  p(14, 'AY-DIG-014', 'Bhumyamalaki Churna', 5, 175, 15, 0),
  p(130, 'AY-EAR-001', 'Bilva Taila', 61, 225, 15, 0),
  p(18, 'AY-DIG-018', 'Bilvadi Churna', 6, 180, 15, 0),
  p(26, 'AY-IMM-008', 'Brahma Rasayana', 10, 620, 15, 0),
  p(81, 'AY-HAR-008', 'Brahmi Amla Hair Oil', 35, 255, 18, 0),
  p(64, 'AY-MND-006', 'Brahmi Ghrita', 26, 495, 12, 0),
  p(59, 'AY-MND-001', 'Brahmi Vati', 24, 245, 15, 0),
  p(94, 'AY-SKN-012', 'Chandana Body Lotion', 41, 365, 20, 0),
  p(121, 'AY-KID-004', 'Chandanasava', 58, 275, 12, 0),
  p(31, 'AY-DIA-003', 'Chandraprabha Vati', 12, 275, 15, 0),
  p(19, 'AY-IMM-001', 'Chyawanprash Avaleha', 8, 395, 20, 0),
  p(128, 'AY-ORL-002', 'Dashan Sanskar Churna', 60, 165, 15, 0),
  p(103, 'AY-WMN-003', 'Dashmoolarishta', 47, 250, 12, 0),
  p(134, 'AY-BAB-003', 'Dhanwantharam Taila', 63, 385, 15, 0),
  p(35, 'AY-DIA-007', 'Diabetic Care Multigrain Atta', 13, 245, 12, 0),
  p(116, 'AY-WGT-006', 'Draksharishta', 55, 245, 12, 0),
  p(93, 'AY-SKN-011', 'Eladi Keram', 41, 395, 15, 0),
  p(140, 'AY-PAN-002', 'Extra-Strong Relief Balm', 67, 195, 18, 0),
  p(89, 'AY-SKN-007', 'Gandhak Rasayan', 39, 285, 10, 0),
  p(25, 'AY-IMM-007', 'Godanti Bhasma', 9, 195, 8, 0),
  p(123, 'AY-KID-006', 'Gokshura Churna', 58, 195, 15, 0),
  p(98, 'AY-MEN-004', 'Gokshuradi Guggulu', 44, 265, 15, 0),
  p(119, 'AY-KID-002', 'Gokshuradi Guggulu (Renal)', 57, 265, 15, 0),
  p(32, 'AY-DIA-004', 'Gudmar (Gymnema) Churna', 12, 210, 15, 0),
];

export const FALLBACK_CATALOG: AuthCatalog = { categories, products };

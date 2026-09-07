import { Banner } from '../types';

// NOTE: every image URL below was manually opened and visually verified
// (not guessed from memory) to make sure it actually depicts relevant,
// unbranded wellness/Ayurveda imagery — replacing an earlier photo that
// (unintentionally) depicted generic retail "SALE" tags, and another that
// turned out to show a visibly branded commercial skincare product.
export const banners: Banner[] = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1606951444141-e5533feb55be?w=1000',
    title: 'Pure Ayurveda, Delivered to You',
    subtitle: 'Discover 100% natural wellness essentials',
    ctaLabel: 'Shop Now',
  },
  {
    id: 'banner-2',
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=1000',
    title: 'Immunity Season',
    subtitle: 'Up to 25% off on immunity boosters',
    ctaLabel: 'Explore Offers',
    targetCategoryId: '7',
  },
  {
    id: 'banner-3',
    image: 'https://images.unsplash.com/photo-1781948237644-4bb872b37c79?w=1000',
    title: 'New: Kumkumadi Glow Oil',
    subtitle: 'Ancient skincare secret, now in your routine',
    ctaLabel: 'Discover',
    targetCategoryId: '36',
  },
];

export const trustBadges = [
  { id: 'trust-1', icon: 'leaf-outline', label: '100% Natural' },
  { id: 'trust-2', icon: 'flask-outline', label: 'Lab Tested' },
  { id: 'trust-3', icon: 'ribbon-outline', label: 'GMP Certified' },
  { id: 'trust-4', icon: 'earth-outline', label: 'Ethically Sourced' },
];

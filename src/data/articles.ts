import { Article } from '../types';

export const articles: Article[] = [
  {
    id: 'art-ashwagandha',
    title: 'Understanding Ashwagandha: A Traditional Adaptogen',
    category: 'Herbs & Roots',
    tags: ['Ashwagandha', 'Stress', 'Adaptogens'],
    image: 'https://images.unsplash.com/photo-1611071536236-4be69f0e5f1c?w=800',
    excerpt:
      'Ashwagandha has been used in Ayurvedic tradition for centuries. Here is what it is, and how it is traditionally used.',
    content: [
      'Ashwagandha (Withania somnifera) is one of the most well-known herbs in Ayurveda, often referred to as an "adaptogen" — a category of herbs traditionally believed to help the body adapt to physical and mental stress.',
      'In classical Ayurvedic texts, Ashwagandha root is described as a "Rasayana", a rejuvenating substance traditionally used to support strength, vitality and calm.',
      'Modern wellness routines often include Ashwagandha in capsule or powder form, typically taken with warm water or milk in the evening.',
      'As with any herbal supplement, it is best to consult a qualified healthcare practitioner before starting, especially if you are pregnant, nursing, or on medication. This article is for educational purposes and does not constitute medical advice.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-07-01',
    readTimeMinutes: 4,
    isFeatured: true,
  },
  {
    id: 'art-aloe-vera',
    title: 'How to Use Aloe Vera in Your Daily Routine',
    category: 'Skin Care',
    tags: ['Aloe Vera', 'Skin Care', 'Natural Remedies'],
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800',
    excerpt:
      'From soothing skin to hair masks, Aloe Vera is a versatile plant with a long history in traditional wellness practices.',
    content: [
      'Aloe Vera has been used across cultures for generations, valued for its soothing gel-like consistency.',
      'In Ayurveda, Aloe Vera (Kumari) is traditionally associated with cooling properties and is often used topically on skin.',
      'A thin layer of pure Aloe Vera gel can be applied to clean skin as part of a nightly routine, or mixed into a hair mask for added moisture.',
      'Always patch-test any new topical product on a small area of skin first to check for sensitivity.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-06-18',
    readTimeMinutes: 3,
  },
  {
    id: 'art-turmeric',
    title: 'The Golden Herb: Turmeric in Ayurveda',
    category: 'Herbs & Roots',
    tags: ['Turmeric', 'Immunity', 'Joint Care'],
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800',
    excerpt:
      'Turmeric, known as "Haridra" in Ayurveda, has a long-standing place in Indian households and traditional wellness.',
    content: [
      'Turmeric is one of the most widely recognized Ayurvedic herbs, prized for its vibrant color and long culinary and traditional use.',
      'Curcumin, the primary active compound in turmeric, is often the focus of modern wellness supplements, usually paired with black pepper extract to support absorption.',
      'In traditional practice, turmeric is used both internally, mixed into warm milk, and topically, as a paste for skin.',
      'This article is educational and does not claim to treat, cure or prevent any disease. Consult a healthcare provider for medical concerns.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-05-22',
    readTimeMinutes: 5,
    isFeatured: true,
  },
  {
    id: 'art-sleep-tips',
    title: '5 Ayurvedic Tips for Better Sleep',
    category: 'Lifestyle',
    tags: ['Sleep', 'Stress', 'Routine'],
    image: 'https://images.unsplash.com/photo-1495197359483-d092478c170a?w=800',
    excerpt:
      'Ayurveda places great emphasis on daily routine, or "Dinacharya", for supporting restful sleep naturally.',
    content: [
      '1. Keep a consistent sleep schedule — Ayurveda emphasizes aligning with natural circadian rhythms.',
      '2. Avoid heavy meals close to bedtime, allowing digestion to settle before rest.',
      '3. Consider a warm oil scalp massage a few times a week as part of your evening wind-down.',
      '4. Herbal teas or warm milk with a pinch of nutmeg are traditional bedtime rituals in many households.',
      '5. Reduce screen time in the hour before bed to help the mind settle.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-04-30',
    readTimeMinutes: 4,
  },
  {
    id: 'art-digestion',
    title: 'Supporting Digestion the Ayurvedic Way',
    category: 'Digestive Health',
    tags: ['Digestion', 'Gut Health', 'Triphala'],
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    excerpt:
      'Ayurveda considers "Agni", or digestive fire, central to overall wellbeing. Here are traditional practices worth knowing.',
    content: [
      'In Ayurveda, healthy digestion is considered foundational to overall wellness.',
      'Simple practices like eating meals at consistent times, chewing food thoroughly, and sipping warm water can support this.',
      'Herbal formulations like Triphala are traditionally taken in the evening to support the digestive process overnight.',
      'If you experience persistent digestive discomfort, please consult a healthcare professional.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-04-10',
    readTimeMinutes: 4,
  },
  {
    id: 'art-hair-care',
    title: 'Traditional Oiling Rituals for Healthy Hair',
    category: 'Hair Care',
    tags: ['Hair Care', 'Bhringraj', 'Scalp Health'],
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    excerpt:
      'Regular oil massage, or "Abhyanga" for the scalp, is a time-honored Ayurvedic practice for hair and scalp health.',
    content: [
      'Warm oil scalp massages have been practiced for generations, using herb-infused oils like Bhringraj and Amla.',
      'The gentle massage is believed to improve circulation to the scalp while the oil nourishes hair strands.',
      'A common routine is to oil the scalp 2-3 times a week, leaving it on for at least an hour before washing.',
      'Hair health is also influenced by diet, stress and sleep — a holistic approach tends to work best.',
    ],
    author: 'AP Pure Care Wellness Desk',
    date: '2026-03-25',
    readTimeMinutes: 3,
  },
];

export const articleCategories = Array.from(new Set(articles.map((a) => a.category)));

// Domain types shared across screens, components and repositories.
// These mirror what a future REST API would return, so repositories can be
// swapped from mock implementations to real API clients without changing
// screen code.

export type ID = string;

export interface ProductVariant {
  id: ID;
  label: string; // e.g. "100g", "200ml", "60 Capsules"
  price: number;
  mrp: number;
  stock: number;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface Product {
  id: ID;
  name: string;
  brand: string;
  categoryId: ID;
  concernIds: string[];
  images: string[];
  price: number;
  mrp: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  description: string;
  benefits: string[];
  ingredients: string[];
  howToUse: string[];
  productInfo: { label: string; value: string }[];
  faqs: ProductFAQ[];
  stock: number;
  variants: ProductVariant[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface Category {
  id: ID;
  name: string;
  icon: string; // ionicons name
  image?: string;
  description?: string;
  productCount: number;
}

export interface Concern {
  id: ID;
  name: string;
  icon: string;
}

export interface ReviewImage {
  uri: string;
}

export interface Review {
  id: ID;
  productId: ID;
  customerName: string;
  rating: number;
  date: string; // ISO date
  verifiedPurchase: boolean;
  title?: string;
  text: string;
  images?: string[];
  helpfulCount: number;
}

export interface Address {
  id: ID;
  label: 'Home' | 'Office' | 'Other';
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CartItem {
  productId: ID;
  variantId: ID;
  quantity: number;
  savedForLater?: boolean;
}

export type OrderStatus =
  'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderItem {
  productId: ID;
  variantId: ID;
  name: string;
  image: string;
  variantLabel: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: ID;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  address: Address;
  paymentMethod: string;
  timeline: OrderTimelineEvent[];
  deliveryEstimate?: string;
}

export interface Coupon {
  id: ID;
  code: string;
  description: string;
  discountType: 'flat' | 'percent' | 'shipping';
  discountValue: number;
  minOrderValue?: number;
  expiryDate: string;
  isApplicable?: boolean;
}

export interface Offer {
  id: ID;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  couponCode?: string;
}

export interface Article {
  id: ID;
  title: string;
  category: string;
  tags: string[];
  image: string;
  excerpt: string;
  content: string[];
  author: string;
  date: string;
  readTimeMinutes: number;
  isFeatured?: boolean;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  avatar?: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  isGuest: boolean;
}

export interface Banner {
  id: ID;
  image: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  targetCategoryId?: ID;
}

export interface DeliveryOption {
  id: ID;
  name: string;
  description: string;
  price: number;
  etaLabel: string;
}

export interface PaymentMethodOption {
  id: ID;
  type: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  label: string;
  icon: string;
  description?: string;
}

export type SortOption =
  'relevance' | 'popularity' | 'rating' | 'price_low_high' | 'price_high_low' | 'newest';

export interface ProductFilters {
  categoryIds?: ID[];
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minRating?: number;
  inStockOnly?: boolean;
  onOfferOnly?: boolean;
}

// Admin-specific
export interface AdminStats {
  revenue: number;
  revenueChangePercent: number;
  orders: number;
  ordersChangePercent: number;
  customers: number;
  customersChangePercent: number;
  products: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  salesTrend: { label: string; value: number }[];
}

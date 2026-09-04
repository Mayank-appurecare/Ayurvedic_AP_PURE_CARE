import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  WishlistTab: undefined;
  CartTab: undefined;
  AccountTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { mode: 'login' | 'register'; mobile: string };
  Main: NavigatorScreenParams<MainTabParamList> | undefined;

  CategoryProducts: { categoryId: string; categoryName?: string; concernId?: string };
  ProductDetail: { productId: string };
  Reviews: { productId: string };
  WriteReview: { productId: string };

  Cart: undefined;
  CheckoutAddress: undefined;
  AddEditAddress: { addressId?: string } | undefined;
  CheckoutDelivery: undefined;
  CheckoutPayment: undefined;
  OrderConfirmation: { orderId: string };
  OrderTracking: { orderId: string };
  MyOrders: { initialTab?: 'all' | 'ongoing' | 'delivered' | 'cancelled' } | undefined;
  OrderDetails: { orderId: string };

  Wishlist: undefined;
  Offers: undefined;
  Articles: undefined;
  ArticleDetail: { articleId: string };
  Search: undefined;

  AccountProfile: undefined;
  Addresses: undefined;
  MyReviews: undefined;
  Notifications: undefined;
  Settings: undefined;
  HelpSupport: undefined;

  AdminRoot: undefined;
};

export type AdminStackParamList = {
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminProducts: undefined;
  AdminAddProduct: undefined;
  AdminEditProduct: { productId: string };
  AdminCategories: undefined;
  AdminInventory: undefined;
  AdminOrders: undefined;
  AdminOrderDetails: { orderId: string };
  AdminCustomers: undefined;
  AdminReviews: undefined;
  AdminCoupons: undefined;
  AdminOffers: undefined;
  AdminBanners: undefined;
  AdminArticles: undefined;
  AdminNotifications: undefined;
  AdminAnalytics: undefined;
  AdminSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

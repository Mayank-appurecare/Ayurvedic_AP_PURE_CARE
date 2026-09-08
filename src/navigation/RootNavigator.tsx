import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
// NOTE: This is the CUSTOMER app. AdminNavigator/admin screens are intentionally
// NOT imported or registered here — admin is a separate app/project. The admin
// source code under src/screens/admin and src/navigation/AdminNavigator.tsx is
// kept on disk untouched for that future separate app, not deleted.

import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
// NOTE: Registration is disabled for now (login-only customer app). The
// RegisterScreen source file is kept on disk, just not registered as a route,
// so there is no way to navigate to it. OTPVerification IS routed — it is the
// second step of the phone + OTP login flow.

import { CategoryProductsScreen } from '../screens/categories/CategoryProductsScreen';
import { ProductDetailScreen } from '../screens/product/ProductDetailScreen';
import { ReviewsScreen } from '../screens/product/ReviewsScreen';
import { WriteReviewScreen } from '../screens/product/WriteReviewScreen';

import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutAddressScreen } from '../screens/checkout/CheckoutAddressScreen';
import { AddEditAddressScreen } from '../screens/checkout/AddEditAddressScreen';
import { CheckoutDeliveryScreen } from '../screens/checkout/CheckoutDeliveryScreen';
import { CheckoutPaymentScreen } from '../screens/checkout/CheckoutPaymentScreen';

import { OrderConfirmationScreen } from '../screens/order/OrderConfirmationScreen';
import { OrderTrackingScreen } from '../screens/order/OrderTrackingScreen';
import { MyOrdersScreen } from '../screens/order/MyOrdersScreen';
import { OrderDetailsScreen } from '../screens/order/OrderDetailsScreen';

import { WishlistScreen } from '../screens/wishlist/WishlistScreen';
import { OffersScreen } from '../screens/offers/OffersScreen';
import { ArticlesScreen } from '../screens/articles/ArticlesScreen';
import { ArticleDetailScreen } from '../screens/articles/ArticleDetailScreen';
import { SearchScreen } from '../screens/search/SearchScreen';

import { ProfileScreen } from '../screens/account/ProfileScreen';
import { AddressesScreen } from '../screens/account/AddressesScreen';
import { MyReviewsScreen } from '../screens/account/MyReviewsScreen';
import { NotificationsScreen } from '../screens/account/NotificationsScreen';
import { SettingsScreen } from '../screens/account/SettingsScreen';
import { HelpSupportScreen } from '../screens/account/HelpSupportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />

      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen
        name="WriteReview"
        component={WriteReviewScreen}
        options={{ presentation: 'modal' }}
      />

      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="CheckoutAddress" component={CheckoutAddressScreen} />
      <Stack.Screen
        name="AddEditAddress"
        component={AddEditAddressScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="CheckoutDelivery" component={CheckoutDeliveryScreen} />
      <Stack.Screen name="CheckoutPayment" component={CheckoutPaymentScreen} />

      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />

      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="Articles" component={ArticlesScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />

      <Stack.Screen name="AccountProfile" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}

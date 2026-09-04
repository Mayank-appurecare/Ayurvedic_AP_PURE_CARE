import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';

import { AdminLoginScreen } from '../screens/admin/AdminLoginScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminProductsScreen } from '../screens/admin/AdminProductsScreen';
import { AdminAddEditProductScreen } from '../screens/admin/AdminAddEditProductScreen';
import { AdminCategoriesScreen } from '../screens/admin/AdminCategoriesScreen';
import { AdminInventoryScreen } from '../screens/admin/AdminInventoryScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AdminOrderDetailsScreen } from '../screens/admin/AdminOrderDetailsScreen';
import { AdminCustomersScreen } from '../screens/admin/AdminCustomersScreen';
import { AdminReviewsScreen } from '../screens/admin/AdminReviewsScreen';
import { AdminCouponsScreen } from '../screens/admin/AdminCouponsScreen';
import { AdminOffersScreen } from '../screens/admin/AdminOffersScreen';
import { AdminBannersScreen } from '../screens/admin/AdminBannersScreen';
import { AdminArticlesScreen } from '../screens/admin/AdminArticlesScreen';
import { AdminNotificationsScreen } from '../screens/admin/AdminNotificationsScreen';
import { AdminAnalyticsScreen } from '../screens/admin/AdminAnalyticsScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AdminLogin">
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="AdminAddProduct" component={AdminAddEditProductScreen} />
      <Stack.Screen name="AdminEditProduct" component={AdminAddEditProductScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Stack.Screen name="AdminInventory" component={AdminInventoryScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminOrderDetails" component={AdminOrderDetailsScreen} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
      <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
      <Stack.Screen name="AdminBanners" component={AdminBannersScreen} />
      <Stack.Screen name="AdminArticles" component={AdminArticlesScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Stack.Navigator>
  );
}

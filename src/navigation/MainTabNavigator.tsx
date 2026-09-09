import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { useCart } from '../context/CartContext';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { WishlistScreen } from '../screens/wishlist/WishlistScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { AccountScreen } from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  CategoriesTab: { active: 'grid', inactive: 'grid-outline' },
  WishlistTab: { active: 'heart', inactive: 'heart-outline' },
  CartTab: { active: 'bag', inactive: 'bag-outline' },
  AccountTab: { active: 'person', inactive: 'person-outline' },
};

function TabBadge({ count }: { count: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export function MainTabNavigator() {
  const { cartCount } = useCart();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const iconSet = ICONS[route.name as keyof MainTabParamList];
          return (
            <View>
              <Ionicons
                name={focused ? iconSet.active : iconSet.inactive}
                size={size}
                color={color}
              />
              {route.name === 'CartTab' && <TabBadge count={cartCount} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{ tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{ tabBarLabel: 'Wishlist' }}
      />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ tabBarLabel: 'Cart' }} />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    // Appearance only. The navigator computes the bar's height from the icon,
    // the label and the device's bottom safe-area inset; setting a height or
    // vertical padding here fought that calculation and collapsed the labels
    // to zero height, so the tabs rendered as bare icons.
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.divider,
    },
    // No marginTop and no lineHeight override: the navigator reserves a fixed
    // slot for the label, and either one pushed the text out of that slot so it
    // rendered clipped to a few pixels.
    tabLabel: { fontSize: typography.tiny.fontSize, fontWeight: '600' },
    badge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: colors.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: colors.textInverse, fontSize: 9, fontWeight: '700' },
  });

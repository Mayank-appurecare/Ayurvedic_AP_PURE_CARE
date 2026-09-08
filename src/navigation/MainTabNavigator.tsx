import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Comfortable content height (icon + label + breathing room) before the
// device's own bottom safe-area inset is added on top of it — this is what
// was previously a hardcoded 62 that clipped labels on many devices.
const TAB_BAR_CONTENT_HEIGHT = 60;

export function MainTabNavigator() {
  const { cartCount } = useCart();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarStyle = useMemo(
    () => [
      styles.tabBar,
      {
        height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
        paddingBottom: Math.max(insets.bottom, 10),
      },
    ],
    [styles, insets.bottom]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
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
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.divider,
      paddingTop: 8,
    },
    tabItem: {
      paddingVertical: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabLabel: { ...typography.tiny, fontWeight: '600', marginTop: 2 },
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

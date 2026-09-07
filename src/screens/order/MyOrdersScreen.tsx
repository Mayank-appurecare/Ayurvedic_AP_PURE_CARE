import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { OrderCard } from '../../components/OrderCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { OrderRepository } from '../../repositories/OrderRepository';
import { useCart } from '../../context/CartContext';
import { Order } from '../../types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';

type Route = RouteProp<RootStackParamList, 'MyOrders'>;
type TabKey = 'all' | 'ongoing' | 'delivered' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_COPY: Record<TabKey, string> = {
  all: 'No orders yet',
  ongoing: 'No ongoing orders',
  delivered: 'No delivered orders',
  cancelled: 'No cancelled orders',
};

function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('AP Pure Care', message);
  }
}

export function MyOrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<TabKey>(params?.initialTab ?? 'all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(false);
    try {
      const result = await OrderRepository.getByStatusGroup(tab);
      setOrders(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const handleReorder = async (orderId: string) => {
    const items = await OrderRepository.reorder(orderId);
    items.forEach((item) => addToCart(item.productId, item.variantId, item.quantity));
    notify('Items added to cart');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="My Orders" showBack onBackPress={() => navigation.goBack()} />

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState label="Loading orders..." />
      ) : error ? (
        <ErrorState onRetry={() => load(activeTab)} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={EMPTY_COPY[activeTab]}
          description="Your orders will show up here."
          actionLabel="Shop Now"
          onAction={() => navigation.navigate('Main', { screen: 'HomeTab' })}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
              onTrack={
                !['delivered', 'cancelled'].includes(order.status)
                  ? () => navigation.navigate('OrderTracking', { orderId: order.id })
                  : undefined
              }
              onReorder={() => handleReorder(order.id)}
            />
          ))}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tabsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { ...typography.captionMedium, color: colors.textSecondary },
  tabLabelActive: { color: colors.textOnPrimary },
  list: { padding: spacing.md, gap: spacing.sm },
});

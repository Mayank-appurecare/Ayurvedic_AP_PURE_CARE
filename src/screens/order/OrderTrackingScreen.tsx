import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { OrderRepository } from '../../repositories/OrderRepository';
import { Order } from '../../types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatDate, formatPrice } from '../../utils/format';

type Route = RouteProp<RootStackParamList, 'OrderTracking'>;

export function OrderTrackingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await OrderRepository.getById(params.orderId);
      setOrder(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params.orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="Track Order" showBack onBackPress={() => navigation.goBack()} />
      {loading ? (
        <LoadingState label="Fetching tracking details..." />
      ) : error || !order ? (
        <ErrorState title="Unable to load order" onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.date}>{formatDate(order.date)}</Text>
            </View>
            {!!order.deliveryEstimate && (
              <Text style={styles.estimate}>{order.deliveryEstimate}</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.addressLine} numberOfLines={2}>
              Delivering to: {order.address.line1}, {order.address.city} - {order.address.pincode}
            </Text>
            <Text style={styles.addressLine}>Payment: {order.paymentMethod}</Text>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <OrderStatusTimeline timeline={order.timeline} />
          </View>

          <View style={styles.itemsCard}>
            <Text style={styles.sectionTitle}>Items in this Order</Text>
            {order.items.map((item) => (
              <View key={`${item.productId}-${item.variantId}`} style={styles.itemRow}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.variantLabel} · Qty {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xxs,
      ...shadow.sm,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    orderNumber: { ...typography.bodyMedium, color: colors.textPrimary },
    date: { ...typography.caption, color: colors.textMuted },
    estimate: { ...typography.captionMedium, color: colors.primary },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
    addressLine: { ...typography.caption, color: colors.textSecondary },
    timelineCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.sm,
    },
    sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.sm },
    itemsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadow.sm,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    itemImage: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
    },
    itemName: { ...typography.body, color: colors.textPrimary },
    itemMeta: { ...typography.caption, color: colors.textMuted },
    itemPrice: { ...typography.bodyMedium, color: colors.textPrimary },
  });

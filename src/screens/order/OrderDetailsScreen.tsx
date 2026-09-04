import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { AddressCard } from '../../components/AddressCard';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { OrderRepository } from '../../repositories/OrderRepository';
import { useCart } from '../../context/CartContext';
import { Order } from '../../types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatDate, formatPrice } from '../../utils/format';

type Route = RouteProp<RootStackParamList, 'OrderDetails'>;

const getStatusMeta = (colors: AppColors): Record<string, { label: string; color: string; bg: string }> => ({
  placed: { label: 'Order Placed', color: colors.info, bg: colors.infoSurface },
  confirmed: { label: 'Confirmed', color: colors.info, bg: colors.infoSurface },
  packed: { label: 'Packed', color: colors.warning, bg: colors.warningSurface },
  shipped: { label: 'Shipped', color: colors.warning, bg: colors.warningSurface },
  out_for_delivery: { label: 'Out for Delivery', color: colors.warning, bg: colors.warningSurface },
  delivered: { label: 'Delivered', color: colors.success, bg: colors.successSurface },
  cancelled: { label: 'Cancelled', color: colors.danger, bg: colors.dangerSurface },
});

function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Ojas Ayurveda', message);
  }
}

export function OrderDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await OrderRepository.cancelOrder(params.orderId);
      if (updated) setOrder(updated);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleReorder = async () => {
    const items = await OrderRepository.reorder(params.orderId);
    items.forEach((item) => addToCart(item.productId, item.variantId, item.quantity));
    notify('Items added to cart');
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <AppHeader title="Order Details" showBack onBackPress={() => navigation.goBack()} />
        <LoadingState label="Loading order details..." />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <AppHeader title="Order Details" showBack onBackPress={() => navigation.goBack()} />
        <ErrorState title="Unable to load order" onRetry={load} />
      </SafeAreaView>
    );
  }

  const meta = getStatusMeta(colors)[order.status];
  const canTrack = !['delivered', 'cancelled'].includes(order.status);
  const canCancel = order.status === 'placed' || order.status === 'confirmed';

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="Order Details" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.date}>Placed on {formatDate(order.date)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((item) => (
            <View key={`${item.productId}-${item.variantId}`} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={2}>
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <AddressCard address={order.address} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
          <View style={styles.divider} />
          <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && <SummaryRow label="Discount" value={`- ${formatPrice(order.discount)}`} valueColor={colors.success} />}
          <SummaryRow label="Delivery Fee" value={order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)} valueColor={order.deliveryFee === 0 ? colors.success : undefined} />
          <View style={styles.divider} />
          <SummaryRow label="Total" value={formatPrice(order.total)} bold />
        </View>

        {order.status !== 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <OrderStatusTimeline timeline={order.timeline} />
          </View>
        )}

        <View style={styles.actions}>
          {canTrack && (
            <PrimaryButton
              label="Track Order"
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
              style={styles.actionBtn}
            />
          )}
          <SecondaryButton label="Reorder" onPress={handleReorder} style={styles.actionBtn} />
          {canCancel && (
            <SecondaryButton
              label="Cancel Order"
              onPress={() => setShowCancelConfirm(true)}
              style={[styles.actionBtn, styles.cancelBtn] as any}
            />
          )}
        </View>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <ConfirmationDialog
        visible={showCancelConfirm}
        title="Cancel Order"
        description={`Are you sure you want to cancel order #${order.orderNumber}?`}
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        cancelLabel="No, Keep Order"
        destructive
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
      />
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : undefined, bold && styles.summaryValueBold]}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xxs, ...shadow.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { ...typography.h4, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.sm },
  statusText: { ...typography.tiny, fontWeight: '700' },
  date: { ...typography.caption, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, ...shadow.sm },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemImage: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  itemName: { ...typography.body, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textMuted },
  itemPrice: { ...typography.bodyMedium, color: colors.textPrimary },
  paymentMethod: { ...typography.body, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryLabelBold: { ...typography.bodyMedium, color: colors.textPrimary },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  summaryValueBold: { ...typography.h4, color: colors.textPrimary },
  actions: { gap: spacing.sm },
  actionBtn: {},
  cancelBtn: { borderColor: colors.danger },
});

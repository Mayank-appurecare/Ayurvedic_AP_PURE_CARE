import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { OrderRepository } from '../../repositories/OrderRepository';
import { Order, OrderStatus } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { OrderStatusTimeline } from '../../components/OrderStatusTimeline';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function AdminOrderDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const route = useRoute<RouteProp<AdminStackParamList, 'AdminOrderDetails'>>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(() => {
    setError(false);
    OrderRepository.getById(orderId)
      .then((o) => setOrder(o ?? null))
      .catch(() => setError(true));
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await OrderRepository.updateStatus(orderId, status);
      if (updated) setOrder(updated);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setConfirmCancel(false);
    setUpdating(true);
    try {
      const updated = await OrderRepository.cancelOrder(orderId);
      if (updated) setOrder(updated);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {!order && !error && <LoadingState label="Loading order..." />}
      {error && <ErrorState onRetry={load} />}

      {order && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.date}>{formatDate(order.date)}</Text>
          </View>

          {order.status !== 'cancelled' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusChips}>
                {STATUS_STEPS.map((step) => (
                  <Pressable
                    key={step.key}
                    disabled={updating}
                    onPress={() => handleStatusChange(step.key)}
                    style={[
                      styles.statusChip,
                      order.status === step.key && styles.statusChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipLabel,
                        order.status === step.key && styles.statusChipLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={updating}
                onPress={() => setConfirmCancel(true)}
                style={styles.cancelBtn}
                accessibilityRole="button"
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.cancelText}>Cancel Order</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={styles.itemRow}>
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

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressName}>{order.address.fullName}</Text>
            <Text style={styles.addressText}>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ''}
            </Text>
            <Text style={styles.addressText}>
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </Text>
            <Text style={styles.addressText}>Phone: {order.address.phone}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.addressText}>{order.paymentMethod}</Text>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={[styles.priceValue, { color: colors.success }]}>
                -{formatPrice(order.discount)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>
                {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <OrderStatusTimeline timeline={order.timeline} />
          </View>
        </ScrollView>
      )}

      <AdminSidebarNav
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminOrders"
      />

      <ConfirmationDialog
        visible={confirmCancel}
        title="Cancel Order"
        description={`Are you sure you want to cancel order #${order?.orderNumber}? This cannot be undone.`}
        confirmLabel="Cancel Order"
        destructive
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.sm,
  },
  orderNumber: { ...typography.h4, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xxs },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusChipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  statusChipLabel: { ...typography.caption, color: colors.textSecondary },
  statusChipLabelActive: { color: colors.textOnPrimary, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  cancelText: { ...typography.captionMedium, color: colors.danger },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  itemName: { ...typography.bodyMedium, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textMuted },
  itemPrice: { ...typography.bodyMedium, color: colors.textPrimary },
  addressName: { ...typography.bodyMedium, color: colors.textPrimary },
  addressText: { ...typography.body, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...typography.body, color: colors.textSecondary },
  priceValue: { ...typography.body, color: colors.textPrimary },
  totalLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  totalValue: { ...typography.h4, color: colors.textPrimary },
});

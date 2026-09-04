import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { formatDate, formatPrice } from '../utils/format';
import { SecondaryButton } from './SecondaryButton';
import { PrimaryButton } from './PrimaryButton';

const getStatusMeta = (colors: AppColors): Record<string, { label: string; color: string; bg: string }> => ({
  placed: { label: 'Order Placed', color: colors.info, bg: colors.infoSurface },
  confirmed: { label: 'Confirmed', color: colors.info, bg: colors.infoSurface },
  packed: { label: 'Packed', color: colors.warning, bg: colors.warningSurface },
  shipped: { label: 'Shipped', color: colors.warning, bg: colors.warningSurface },
  out_for_delivery: { label: 'Out for Delivery', color: colors.warning, bg: colors.warningSurface },
  delivered: { label: 'Delivered', color: colors.success, bg: colors.successSurface },
  cancelled: { label: 'Cancelled', color: colors.danger, bg: colors.dangerSurface },
});

interface Props {
  order: Order;
  onPress: () => void;
  onReorder?: () => void;
  onTrack?: () => void;
}

export function OrderCard({ order, onPress, onReorder, onTrack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meta = useMemo(() => getStatusMeta(colors)[order.status], [colors, order.status]);
  const firstItem = order.items[0];
  const extraCount = order.items.length - 1;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatDate(order.date)}</Text>
      <View style={styles.itemRow}>
        <Image source={{ uri: firstItem.image }} style={styles.image} />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {firstItem.name}
          </Text>
          {extraCount > 0 && <Text style={styles.moreItems}>+{extraCount} more item{extraCount > 1 ? 's' : ''}</Text>}
          <Text style={styles.amount}>{formatPrice(order.total)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onTrack && !['delivered', 'cancelled'].includes(order.status) && (
          <PrimaryButton label="Track Order" onPress={onTrack} size="md" style={styles.actionBtn} />
        )}
        {onReorder && (
          <SecondaryButton label="Reorder" onPress={onReorder} style={styles.actionBtn} />
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, ...shadow.sm },
  pressed: { opacity: 0.95 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { ...typography.bodyMedium, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.sm },
  statusText: { ...typography.tiny, fontWeight: '700' },
  date: { ...typography.caption, color: colors.textMuted },
  itemRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xxs },
  image: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  itemName: { ...typography.bodyMedium, color: colors.textPrimary },
  moreItems: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1 },
});

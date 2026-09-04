import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { OrderRepository } from '../../repositories/OrderRepository';
import { Order, OrderStatus } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const STATUS_FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  placed: { label: 'Placed', color: colors.info, bg: colors.infoSurface },
  confirmed: { label: 'Confirmed', color: colors.info, bg: colors.infoSurface },
  packed: { label: 'Packed', color: colors.warning, bg: colors.warningSurface },
  shipped: { label: 'Shipped', color: colors.warning, bg: colors.warningSurface },
  out_for_delivery: { label: 'Out for Delivery', color: colors.warning, bg: colors.warningSurface },
  delivered: { label: 'Delivered', color: colors.success, bg: colors.successSurface },
  cancelled: { label: 'Cancelled', color: colors.danger, bg: colors.dangerSurface },
};

export function AdminOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(() => {
    setError(false);
    OrderRepository.getAll()
      .then(setOrders)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = (orders ?? []).filter((o) => {
    const matchesQuery = !query.trim() || o.orderNumber.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Orders</Text>
        <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open admin menu">
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {orders === null && !error && <LoadingState label="Loading orders..." />}
      {error && <ErrorState onRetry={load} />}

      {orders !== null && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.filtersWrap}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by order number"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
              </View>
              <FlatList
                horizontal
                data={STATUS_FILTERS}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.xs }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setStatusFilter(item.key)}
                    style={[styles.chip, statusFilter === item.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, statusFilter === item.key && styles.chipLabelActive]}>{item.label}</Text>
                  </Pressable>
                )}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders found" description="Try a different search or filter." />
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status];
            return (
              <Pressable
                onPress={() => navigation.navigate('AdminOrderDetails', { orderId: item.id })}
                style={styles.row}
                accessibilityRole="button"
              >
                <Image source={{ uri: item.items[0]?.image }} style={styles.thumb} />
                <View style={styles.rowInfo}>
                  <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {item.address.fullName} · {item.items.length} item{item.items.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.total}>{formatPrice(item.total)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <AdminSidebarNav visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="AdminOrders" />
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
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  filtersWrap: { gap: spacing.sm, marginBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnPrimary, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  rowInfo: { flex: 1, gap: 2 },
  orderNumber: { ...typography.bodyMedium, color: colors.textPrimary },
  customerName: { ...typography.caption, color: colors.textSecondary },
  date: { ...typography.tiny, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  total: { ...typography.bodyMedium, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.sm },
  statusText: { ...typography.tiny, fontWeight: '700' },
});

import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { AdminRepository } from '../../repositories/AdminRepository';
import { AdminStats, Order, Product, Review } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { RatingStars } from '../../components/RatingStars';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const QUICK_LINKS: {
  label: string;
  route: keyof AdminStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'Products', route: 'AdminProducts', icon: 'cube-outline' },
  { label: 'Orders', route: 'AdminOrders', icon: 'receipt-outline' },
  { label: 'Customers', route: 'AdminCustomers', icon: 'people-outline' },
  { label: 'Categories', route: 'AdminCategories', icon: 'grid-outline' },
  { label: 'Inventory', route: 'AdminInventory', icon: 'file-tray-stacked-outline' },
  { label: 'Coupons', route: 'AdminCoupons', icon: 'pricetag-outline' },
  { label: 'Analytics', route: 'AdminAnalytics', icon: 'bar-chart-outline' },
  { label: 'Settings', route: 'AdminSettings', icon: 'settings-outline' },
];

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsData, bestSellersData, ordersData, reviewsData] = await Promise.all([
        AdminRepository.getDashboardStats(),
        AdminRepository.getBestSellers(),
        AdminRepository.getRecentOrders(),
        AdminRepository.getRecentReviews(),
      ]);
      setStats(statsData);
      setBestSellers(bestSellersData);
      setRecentOrders(ordersData);
      setRecentReviews(reviewsData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxTrendValue = stats ? Math.max(...stats.salesTrend.map((t) => t.value), 1) : 1;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setSidebarVisible(true)}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <LoadingState label="Loading dashboard..." />
      ) : error || !stats ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickLinksRow}
          >
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.route}
                onPress={() => navigation.navigate(link.route as never)}
                style={styles.quickLinkChip}
                accessibilityRole="button"
                accessibilityLabel={link.label}
              >
                <Ionicons name={link.icon} size={16} color={colors.adminAccent} />
                <Text style={styles.quickLinkLabel}>{link.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.kpiGrid}>
            <KpiCard
              label="Revenue"
              value={formatPrice(stats.revenue)}
              changePercent={stats.revenueChangePercent}
              icon="cash-outline"
            />
            <KpiCard
              label="Orders"
              value={String(stats.orders)}
              changePercent={stats.ordersChangePercent}
              icon="receipt-outline"
            />
            <KpiCard
              label="Customers"
              value={String(stats.customers)}
              changePercent={stats.customersChangePercent}
              icon="people-outline"
            />
            <KpiCard label="Products" value={String(stats.products)} icon="cube-outline" />
            <KpiCard
              label="Low Stock"
              value={String(stats.lowStockCount)}
              icon="alert-circle-outline"
              tone="warning"
            />
            <KpiCard
              label="Pending Orders"
              value={String(stats.pendingOrdersCount)}
              icon="time-outline"
              tone="warning"
            />
          </View>

          <SectionCard title="Sales Trend (This Week)">
            <View style={styles.chartRow}>
              {stats.salesTrend.map((point) => (
                <View key={point.label} style={styles.chartBarColumn}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { height: `${Math.max((point.value / maxTrendValue) * 100, 4)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>{point.label}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="Best Sellers" onSeeAll={() => navigation.navigate('AdminProducts')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bestSellers.map((product) => (
                <View key={product.id} style={styles.bestSellerCard}>
                  <Image source={{ uri: product.images[0] }} style={styles.bestSellerImage} />
                  <Text style={styles.bestSellerName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.bestSellerMeta}>{product.reviewCount} reviews</Text>
                </View>
              ))}
            </ScrollView>
          </SectionCard>

          <SectionCard title="Recent Orders" onSeeAll={() => navigation.navigate('AdminOrders')}>
            {recentOrders.map((order) => (
              <Pressable
                key={order.id}
                style={styles.listRow}
                onPress={() => navigation.navigate('AdminOrderDetails', { orderId: order.id })}
              >
                <View style={styles.listRowIcon}>
                  <Ionicons name="receipt-outline" size={16} color={colors.adminAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>#{order.orderNumber}</Text>
                  <Text style={styles.listRowSubtitle}>
                    {formatDate(order.date)} • {STATUS_LABEL[order.status] ?? order.status}
                  </Text>
                </View>
                <Text style={styles.listRowValue}>{formatPrice(order.total)}</Text>
              </Pressable>
            ))}
          </SectionCard>

          <SectionCard title="Recent Reviews" onSeeAll={() => navigation.navigate('AdminReviews')}>
            {recentReviews.map((review) => (
              <View key={review.id} style={styles.reviewRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.listRowTitle}>{review.customerName}</Text>
                    <RatingStars rating={review.rating} size={12} />
                  </View>
                  <Text style={styles.reviewSnippet} numberOfLines={2}>
                    {review.text}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      <AdminSidebarNav
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeRoute="AdminDashboard"
      />
    </SafeAreaView>
  );
}

function KpiCard({
  label,
  value,
  changePercent,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  changePercent?: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'warning';
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconWrap, tone === 'warning' && styles.kpiIconWrapWarning]}>
        <Ionicons
          name={icon}
          size={18}
          color={tone === 'warning' ? colors.warning : colors.adminAccent}
        />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {changePercent !== undefined && (
        <View style={styles.kpiChangeRow}>
          <Ionicons
            name={changePercent >= 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={changePercent >= 0 ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.kpiChangeText,
              { color: changePercent >= 0 ? colors.success : colors.danger },
            ]}
          >
            {Math.abs(changePercent)}%
          </Text>
        </View>
      )}
    </View>
  );
}

function SectionCard({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
          >
            <Text style={styles.sectionSeeAll}>See All</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.adminSidebar,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h4, color: colors.textInverse },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  quickLinksRow: { marginBottom: spacing.xs },
  quickLinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    ...shadow.sm,
  },
  quickLinkLabel: { ...typography.captionMedium, color: colors.textPrimary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    ...shadow.sm,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiIconWrapWarning: { backgroundColor: colors.warningSurface },
  kpiValue: { ...typography.h3, color: colors.textPrimary },
  kpiLabel: { ...typography.caption, color: colors.textSecondary },
  kpiChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  kpiChangeText: { ...typography.tiny, fontWeight: '700' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  sectionSeeAll: { ...typography.captionMedium, color: colors.adminAccent },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  chartBarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarTrack: {
    width: 18,
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: { width: '100%', backgroundColor: colors.adminAccent, borderRadius: radius.sm },
  chartBarLabel: { ...typography.tiny, color: colors.textMuted },
  bestSellerCard: { width: 110, marginRight: spacing.sm },
  bestSellerImage: {
    width: 110,
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  bestSellerName: { ...typography.captionMedium, color: colors.textPrimary, marginTop: 4 },
  bestSellerMeta: { ...typography.tiny, color: colors.textMuted },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listRowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRowTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  listRowSubtitle: { ...typography.caption, color: colors.textMuted },
  listRowValue: { ...typography.bodyMedium, color: colors.textPrimary },
  reviewRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  reviewSnippet: { ...typography.caption, color: colors.textSecondary },
});

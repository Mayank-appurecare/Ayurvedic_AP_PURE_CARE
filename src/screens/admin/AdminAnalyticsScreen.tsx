import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { AdminRepository } from '../../repositories/AdminRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { ProductRepository } from '../../repositories/ProductRepository';
import { AdminStats, Category, Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const DATE_RANGES = ['Today', '7 Days', '30 Days', 'This Year'] as const;
type DateRange = (typeof DATE_RANGES)[number];

const RATING_BUCKETS = [
  { label: '4★ - 5★', min: 4, max: 5.01 },
  { label: '3★ - 4★', min: 3, max: 4 },
  { label: '2★ - 3★', min: 2, max: 3 },
  { label: 'Below 2★', min: 0, max: 2 },
];

export function AdminAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState<DateRange>('7 Days');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([
      AdminRepository.getDashboardStats(),
      CategoryRepository.getAll(),
      ProductRepository.getAll(),
    ])
      .then(([s, c, p]) => {
        setStats(s);
        setCategories(c);
        setProducts(p);
      })
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loading = stats === null || categories === null || products === null;
  const maxTrendValue = stats ? Math.max(...stats.salesTrend.map((d) => d.value)) : 1;
  const sortedCategories = categories
    ? [...categories].sort((a, b) => b.productCount - a.productCount).slice(0, 6)
    : [];
  const maxCategoryCount = sortedCategories.length
    ? Math.max(...sortedCategories.map((c) => c.productCount))
    : 1;
  const ratingCounts = RATING_BUCKETS.map((bucket) => ({
    ...bucket,
    count: products
      ? products.filter((p) => p.rating >= bucket.min && p.rating < bucket.max).length
      : 0,
  }));
  const maxRatingCount = Math.max(1, ...ratingCounts.map((b) => b.count));

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
        <Text style={styles.headerTitle}>Analytics</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading && !error && <LoadingState label="Loading analytics..." />}
      {error && <ErrorState onRetry={load} />}

      {!loading && !error && stats && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {DATE_RANGES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeChip, range === r && styles.rangeChipActive]}
                accessibilityRole="button"
                accessibilityLabel={r}
              >
                <Text style={[styles.rangeChipLabel, range === r && styles.rangeChipLabelActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.rangeNote}>
            Showing consistent sample data across all date ranges in this prototype.
          </Text>

          <View style={styles.statsRow}>
            <StatTile label="Revenue" value={formatPrice(stats.revenue)} icon="cash-outline" />
            <StatTile label="Orders" value={String(stats.orders)} icon="receipt-outline" />
            <StatTile label="Customers" value={String(stats.customers)} icon="people-outline" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenue by Day</Text>
            <View style={styles.barChartRow}>
              {stats.salesTrend.map((point) => (
                <View key={point.label} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${Math.max(6, (point.value / maxTrendValue) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{point.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Categories by Product Count</Text>
            {sortedCategories.map((cat) => (
              <View key={cat.id} style={styles.hBarRow}>
                <Text style={styles.hBarLabel} numberOfLines={1}>
                  {cat.name}
                </Text>
                <View style={styles.hBarTrack}>
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${Math.max(6, (cat.productCount / maxCategoryCount) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.hBarValue}>{cat.productCount}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Rating Distribution</Text>
            {ratingCounts.map((bucket) => (
              <View key={bucket.label} style={styles.hBarRow}>
                <Text style={styles.hBarLabel} numberOfLines={1}>
                  {bucket.label}
                </Text>
                <View style={styles.hBarTrack}>
                  <View
                    style={[
                      styles.hBarFill,
                      styles.hBarFillGold,
                      { width: `${Math.max(6, (bucket.count / maxRatingCount) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.hBarValue}>{bucket.count}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <AdminSidebarNav
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminAnalytics"
      />
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={18} color={colors.adminAccent} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  rangeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rangeChipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  rangeChipLabel: { ...typography.caption, color: colors.textSecondary },
  rangeChipLabelActive: { color: colors.textOnPrimary, fontWeight: '600' },
  rangeNote: { ...typography.tiny, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 2,
    ...shadow.sm,
  },
  statValue: { ...typography.h4, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: spacing.xxs,
  },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: {
    width: '60%',
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: colors.adminAccent, borderRadius: radius.sm },
  barLabel: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
  hBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hBarLabel: { ...typography.caption, color: colors.textSecondary, width: 100 },
  hBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  hBarFill: { height: '100%', backgroundColor: colors.adminAccent, borderRadius: radius.pill },
  hBarFillGold: { backgroundColor: colors.accentGold },
  hBarValue: {
    ...typography.captionMedium,
    color: colors.textPrimary,
    width: 28,
    textAlign: 'right',
  },
});

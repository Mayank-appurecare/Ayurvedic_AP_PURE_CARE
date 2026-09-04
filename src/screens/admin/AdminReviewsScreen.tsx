import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { reviews as mockReviews } from '../../data/reviews';
import { ProductRepository } from '../../repositories/ProductRepository';
import { Review } from '../../types';
import { formatDate } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { RatingStars } from '../../components/RatingStars';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

interface AdminReview extends Review {
  productName: string;
}

const FILTERS = [0, 5, 4, 3, 2, 1];

export function AdminReviewsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [removeTarget, setRemoveTarget] = useState<AdminReview | null>(null);

  const load = useCallback(() => {
    setError(false);
    Promise.all(
      mockReviews.map(async (review) => {
        const product = await ProductRepository.getById(review.productId);
        return { ...review, productName: product?.name ?? 'Unknown Product' };
      })
    )
      .then(setReviews)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Local-only removal for this demo — there is no delete-review repository method / backend persistence.
  const handleRemove = () => {
    if (!removeTarget) return;
    setReviews((prev) => (prev ? prev.filter((r) => r.id !== removeTarget.id) : prev));
    setRemoveTarget(null);
  };

  const filtered = (reviews ?? []).filter((r) => activeFilter === 0 || r.rating === activeFilter);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Reviews</Text>
        <Pressable onPress={() => setSidebarOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open admin menu">
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {reviews === null && !error && <LoadingState label="Loading reviews..." />}
      {error && <ErrorState onRetry={load} />}

      {reviews !== null && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => String(item)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.xs, marginBottom: spacing.sm }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setActiveFilter(item)}
                  style={[styles.chip, activeFilter === item && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, activeFilter === item && styles.chipLabelActive]}>
                    {item === 0 ? 'All' : `${item}★`}
                  </Text>
                </Pressable>
              )}
            />
          }
          ListEmptyComponent={
            <EmptyState icon="star-outline" title="No reviews found" description="Try a different filter." />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    on {item.productName}
                  </Text>
                </View>
                <Pressable onPress={() => setRemoveTarget(item)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove review">
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
              <View style={styles.metaRow}>
                <RatingStars rating={item.rating} size={13} />
                {item.verifiedPurchase && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>
              {!!item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
              <Text style={styles.reviewText}>{item.text}</Text>
              <Text style={styles.helpful}>Helpful ({item.helpfulCount})</Text>
            </View>
          )}
        />
      )}

      <AdminSidebarNav visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="AdminReviews" />

      <ConfirmationDialog
        visible={!!removeTarget}
        title="Remove Review"
        description="This review will be hidden from this admin listing for this demo session."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
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
  listContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, gap: 4, ...shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  customerName: { ...typography.bodyMedium, color: colors.textPrimary },
  productName: { ...typography.caption, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedText: { ...typography.tiny, color: colors.success },
  date: { ...typography.tiny, color: colors.textMuted },
  reviewTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 4 },
  reviewText: { ...typography.body, color: colors.textSecondary },
  helpful: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
});

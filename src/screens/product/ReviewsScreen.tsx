import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { Review } from '../../types';
import { ReviewRepository } from '../../repositories/ReviewRepository';

import { AppHeader } from '../../components/AppHeader';
import { RatingStars } from '../../components/RatingStars';
import { ReviewCard } from '../../components/ReviewCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rte = RouteProp<RootStackParamList, 'Reviews'>;

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { star: number; count: number }[];
}

const FILTERS = [0, 5, 4, 3, 2, 1];

export function ReviewsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rte>();
  const { productId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([ReviewRepository.getForProduct(productId), ReviewRepository.getSummary(productId)])
      .then(([reviewList, summaryResult]) => {
        setReviews(reviewList);
        setSummary(summaryResult);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredReviews = useMemo(
    () => (activeFilter === 0 ? reviews : reviews.filter((r) => r.rating === activeFilter)),
    [reviews, activeFilter]
  );

  const handleHelpful = (reviewId: string) => {
    ReviewRepository.markHelpful(reviewId);
  };

  const toggleFilter = (star: number) => {
    setActiveFilter((current) => (current === star ? 0 : star));
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <AppHeader title="Ratings & Reviews" showBack onBackPress={() => navigation.goBack()} />

      {status === 'loading' && <LoadingState label="Loading reviews..." />}
      {status === 'error' && <ErrorState onRetry={load} />}

      {status === 'ready' && summary && (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ReviewCard review={item} onHelpful={handleHelpful} />}
          ListHeaderComponent={
            <View>
              <View style={styles.summaryRow}>
                <View style={styles.averageBlock}>
                  <Text style={styles.averageNumber}>{summary.average.toFixed(1)}</Text>
                  <RatingStars rating={summary.average} size={16} />
                  <Text style={styles.totalText}>{summary.total} ratings</Text>
                </View>
                <View style={styles.distBlock}>
                  {summary.distribution.map((row) => (
                    <Pressable key={row.star} onPress={() => toggleFilter(row.star)} style={styles.distRow}>
                      <Text style={[styles.distLabel, activeFilter === row.star && styles.distLabelActive]}>
                        {row.star}★
                      </Text>
                      <View style={styles.distTrack}>
                        <View
                          style={[
                            styles.distFill,
                            { width: summary.total ? `${(row.count / summary.total) * 100}%` : '0%' },
                          ]}
                        />
                      </View>
                      <Text style={styles.distCount}>{row.count}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <FlatList
                data={FILTERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `filter-${item}`}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => {
                  const active = activeFilter === item;
                  return (
                    <Pressable onPress={() => toggleFilter(item)} style={[styles.filterChip, active && styles.filterChipActive]}>
                      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                        {item === 0 ? 'All' : `${item}★`}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No reviews found"
              description={activeFilter ? `No ${activeFilter}-star reviews yet.` : 'Be the first to review this product.'}
            />
          }
        />
      )}

      <View style={styles.footer}>
        <PrimaryButton label="Write a Review" onPress={() => navigation.navigate('WriteReview', { productId })} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },
  summaryRow: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.md },
  averageBlock: { alignItems: 'center', justifyContent: 'center', width: 90, gap: 4 },
  averageNumber: { ...typography.h1, color: colors.textPrimary },
  totalText: { ...typography.caption, color: colors.textMuted },
  distBlock: { flex: 1, justifyContent: 'center', gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  distLabel: { ...typography.captionMedium, color: colors.textSecondary, width: 26 },
  distLabelActive: { color: colors.primary },
  distTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: colors.star, borderRadius: 4 },
  distCount: { ...typography.tiny, color: colors.textMuted, width: 24, textAlign: 'right' },
  filterRow: { gap: spacing.xs, paddingBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterLabel: { ...typography.captionMedium, color: colors.textSecondary },
  filterLabelActive: { color: colors.textOnPrimary },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});

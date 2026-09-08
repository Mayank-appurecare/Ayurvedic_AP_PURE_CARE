import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../types';
import { radius, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { RatingStars } from './RatingStars';
import { formatDate } from '../utils/format';

export function ReviewCard({
  review,
  onHelpful,
}: {
  review: Review;
  onHelpful?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [marked, setMarked] = useState(false);

  const handleHelpful = () => {
    if (marked) return;
    setMarked(true);
    onHelpful?.(review.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.customerName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {review.customerName}
            </Text>
            {review.verifiedPurchase && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.verifiedText}>Verified Purchase</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formatDate(review.date)}</Text>
        </View>
      </View>
      <RatingStars rating={review.rating} size={13} />
      {review.title && <Text style={styles.title}>{review.title}</Text>}
      <Text style={styles.text}>{review.text}</Text>
      {!!review.images?.length && (
        <View style={styles.imagesRow}>
          {review.images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.reviewImage} />
          ))}
        </View>
      )}
      <Pressable onPress={handleHelpful} style={styles.helpfulBtn} accessibilityRole="button">
        <Ionicons
          name={marked ? 'thumbs-up' : 'thumbs-up-outline'}
          size={14}
          color={marked ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.helpfulText, marked && styles.helpfulTextActive]}>
          Helpful ({review.helpfulCount + (marked ? 1 : 0)})
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: spacing.xxs,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.bodyMedium, color: colors.primary },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    name: { ...typography.bodyMedium, color: colors.textPrimary },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    verifiedText: { ...typography.tiny, color: colors.success },
    date: { ...typography.caption, color: colors.textMuted },
    title: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 4 },
    text: { ...typography.body, color: colors.textSecondary },
    imagesRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
    reviewImage: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
    },
    helpfulBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    helpfulText: { ...typography.caption, color: colors.textSecondary },
    helpfulTextActive: { color: colors.primary },
  });

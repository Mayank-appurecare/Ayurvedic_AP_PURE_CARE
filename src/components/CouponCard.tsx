import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Coupon } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { formatDate } from '../utils/format';
import { ConfettiBurst } from './ConfettiBurst';

interface Props {
  coupon: Coupon;
  onApply?: () => void;
  showApply?: boolean;
  /** This coupon is the one currently applied to the cart. */
  applied?: boolean;
  /** Plays the confetti burst once, right after this coupon was applied. */
  justApplied?: boolean;
}

export function CouponCard({ coupon, onApply, showApply, applied, justApplied }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await Clipboard.setStringAsync(coupon.code);
    // Momentary "Copied" confirmation, since the OS clipboard write itself
    // is silent and gave no indication anything happened.
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const discountLabel =
    coupon.discountType === 'flat'
      ? `Flat ₹${coupon.discountValue} OFF`
      : coupon.discountType === 'percent'
        ? `${coupon.discountValue}% OFF`
        : 'FREE SHIPPING';

  return (
    <View style={[styles.card, !coupon.isApplicable && styles.cardDisabled]}>
      <View style={styles.left}>
        <Ionicons
          name="pricetag"
          size={22}
          color={coupon.isApplicable ? colors.accentGold : colors.textMuted}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.discountLabel}>{discountLabel}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {coupon.description}
        </Text>
        <View style={styles.codeRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeText}>{coupon.code}</Text>
          </View>
          <Pressable
            onPress={handleCopy}
            hitSlop={8}
            style={styles.copyBtn}
            accessibilityRole="button"
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={14}
              color={copied ? colors.success : colors.primary}
            />
            <Text style={[styles.copyText, copied && styles.copiedText]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.expiry}>
          {coupon.isApplicable
            ? `Valid till ${formatDate(coupon.expiryDate)}`
            : 'Not applicable to current cart'}
        </Text>
      </View>
      {showApply &&
        (applied ? (
          <View style={styles.appliedWrap}>
            <View style={styles.appliedBtn}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.appliedText}>Applied</Text>
            </View>
            {justApplied && <ConfettiBurst />}
          </View>
        ) : (
          <Pressable
            onPress={onApply}
            disabled={!coupon.isApplicable}
            style={[styles.applyBtn, !coupon.isApplicable && styles.applyBtnDisabled]}
            accessibilityRole="button"
          >
            <Text style={[styles.applyText, !coupon.isApplicable && styles.applyTextDisabled]}>
              Apply
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      ...shadow.sm,
    },
    cardDisabled: { opacity: 0.6 },
    left: { alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, gap: 3 },
    discountLabel: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' },
    description: { ...typography.caption, color: colors.textSecondary },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
    codeChip: {
      backgroundColor: colors.primarySurface,
      paddingHorizontal: spacing.xs,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    codeText: { ...typography.captionMedium, color: colors.primary, letterSpacing: 0.5 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    copyText: { ...typography.tiny, color: colors.primary },
    copiedText: { color: colors.success },
    expiry: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
    applyBtn: {
      alignSelf: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
    },
    applyBtnDisabled: { backgroundColor: colors.surfaceMuted },
    applyText: { ...typography.captionMedium, color: colors.textOnPrimary },
    applyTextDisabled: { color: colors.textMuted },
    appliedWrap: { alignSelf: 'center' },
    appliedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.successSurface,
      borderRadius: radius.sm,
    },
    appliedText: { ...typography.captionMedium, color: colors.success },
  });

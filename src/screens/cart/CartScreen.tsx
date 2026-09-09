import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { PriceDisplay } from '../../components/PriceDisplay';
import { QuantitySelector } from '../../components/QuantitySelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useCart, EnrichedCartItem } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { OfferRepository } from '../../repositories/OfferRepository';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatPrice, roundCurrency } from '../../utils/format';
import { FREE_DELIVERY_THRESHOLD } from '../../data/checkoutOptions';

const MOCK_DELIVERY_FEE = 49;

export function CartScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    enrichedItems,
    savedForLaterItems,
    isReady,
    subtotal,
    mrpTotal,
    discountTotal,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
  } = useCart();
  const { appliedCoupon, setAppliedCoupon } = useCheckout();
  const [removeTarget, setRemoveTarget] = useState<EnrichedCartItem | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const showBack = navigation.canGoBack();
  const deliveryFee =
    enrichedItems.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : MOCK_DELIVERY_FEE;
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'flat'
      ? appliedCoupon.discountValue
      : appliedCoupon.discountType === 'percent'
        ? roundCurrency((subtotal * appliedCoupon.discountValue) / 100)
        : 0
    : 0;
  const total = roundCurrency(Math.max(subtotal - couponDiscount + deliveryFee, 0));

  const goShopping = () => navigation.navigate('Main', { screen: 'HomeTab' });

  const handleApplyCouponCode = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const result = await OfferRepository.validateCoupon(code, subtotal);
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponInput('');
        // One-shot confetti trigger, cleared after the burst finishes so it
        // never replays on an unrelated re-render.
        setJustApplied(true);
        setTimeout(() => setJustApplied(false), 900);
      } else {
        setCouponError(result.message);
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <AppHeader title="My Cart" showBack={showBack} onBackPress={() => navigation.goBack()} />
        <LoadingState label="Loading your cart..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="My Cart" showBack={showBack} onBackPress={() => navigation.goBack()} />

      {enrichedItems.length === 0 && savedForLaterItems.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Shop Now"
          onAction={goShopping}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {enrichedItems.length === 0 ? (
            <EmptyState
              icon="cart-outline"
              title="Your cart is empty"
              description="Move items back from Saved for Later, or continue shopping."
            />
          ) : (
            <View style={styles.section}>
              {enrichedItems.map((item) => (
                <View key={`${item.productId}-${item.variantId}`} style={styles.itemCard}>
                  <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.variantLabel}>{item.variantLabel}</Text>
                    <PriceDisplay price={item.unitPrice} mrp={item.unitMrp} size="sm" />
                    <View style={styles.itemActionsRow}>
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        onDecrease={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        size="sm"
                      />
                      <Pressable
                        onPress={() => saveForLater(item.productId, item.variantId)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Save for later"
                      >
                        <Text style={styles.linkText}>Save for later</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setRemoveTarget(item)}
                    hitSlop={8}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove item"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {savedForLaterItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved for Later ({savedForLaterItems.length})</Text>
              {savedForLaterItems.map((item) => (
                <View key={`${item.productId}-${item.variantId}`} style={styles.itemCard}>
                  <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.variantLabel}>{item.variantLabel}</Text>
                    <PriceDisplay price={item.unitPrice} mrp={item.unitMrp} size="sm" />
                    <Pressable
                      onPress={() => moveToCart(item.productId, item.variantId)}
                      hitSlop={6}
                      style={{ marginTop: spacing.xxs }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.linkText}>Move to Cart</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => removeFromCart(item.productId, item.variantId)}
                    hitSlop={8}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove item"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {enrichedItems.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Price Details</Text>
              <SummaryRow label="MRP Total" value={formatPrice(mrpTotal)} />
              <SummaryRow
                label="Discount on MRP"
                value={`- ${formatPrice(discountTotal)}`}
                valueColor={colors.success}
              />
              <SummaryRow
                label="Delivery Fee"
                value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                valueColor={deliveryFee === 0 ? colors.success : colors.textPrimary}
              />
              {appliedCoupon ? (
                <View style={styles.couponRow}>
                  <View style={styles.couponAppliedChip}>
                    <Ionicons name="pricetag" size={13} color={colors.primary} />
                    <Text style={styles.couponAppliedText}>{appliedCoupon.code} applied</Text>
                    {justApplied && <ConfettiBurst />}
                  </View>
                  <Pressable
                    onPress={() => setAppliedCoupon(null)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove coupon"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.couponSection}>
                  <View style={styles.couponInputRow}>
                    <TextInput
                      value={couponInput}
                      onChangeText={(text) => {
                        setCouponInput(text.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      style={styles.couponInput}
                    />
                    <Pressable
                      onPress={handleApplyCouponCode}
                      disabled={!couponInput.trim() || applyingCoupon}
                      style={[
                        styles.couponApplyBtn,
                        (!couponInput.trim() || applyingCoupon) && styles.couponApplyBtnDisabled,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.couponApplyText,
                          (!couponInput.trim() || applyingCoupon) && styles.couponApplyTextDisabled,
                        ]}
                      >
                        Apply
                      </Text>
                    </Pressable>
                  </View>
                  {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
                  <Pressable
                    onPress={() => navigation.navigate('Offers')}
                    style={styles.browseOffersBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.linkText}>View all coupons</Text>
                  </Pressable>
                </View>
              )}
              {couponDiscount > 0 && (
                <SummaryRow
                  label="Coupon Discount"
                  value={`- ${formatPrice(couponDiscount)}`}
                  valueColor={colors.success}
                />
              )}
              <View style={styles.divider} />
              <SummaryRow label="Total Amount" value={formatPrice(total)} bold />
            </View>
          )}

          {enrichedItems.length > 0 && (
            <View style={styles.checkoutCard}>
              <View>
                <Text style={styles.footerTotalLabel}>Total</Text>
                <Text style={styles.footerTotalValue}>{formatPrice(total)}</Text>
              </View>
              <PrimaryButton
                label="Proceed to Checkout"
                onPress={() => navigation.navigate('CheckoutAddress')}
                fullWidth={false}
                style={styles.checkoutBtn}
              />
            </View>
          )}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={!!removeTarget}
        title="Remove Item"
        description={`Remove "${removeTarget?.product.name}" from your cart?`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeFromCart(removeTarget.productId, removeTarget.variantId);
          setRemoveTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          valueColor ? { color: valueColor } : undefined,
          bold && styles.summaryValueBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md },
    section: { gap: spacing.sm },
    sectionTitle: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xxs,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm,
      gap: spacing.sm,
      ...shadow.sm,
    },
    itemImage: {
      width: 76,
      height: 76,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    itemInfo: { flex: 1, gap: 3 },
    itemName: { ...typography.bodyMedium, color: colors.textPrimary },
    variantLabel: { ...typography.caption, color: colors.textMuted },
    itemActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xxs,
    },
    linkText: { ...typography.captionMedium, color: colors.primary },
    removeBtn: { padding: spacing.xxs },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      ...shadow.sm,
    },
    summaryTitle: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xxs,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { ...typography.body, color: colors.textSecondary },
    summaryLabelBold: { ...typography.bodyMedium, color: colors.textPrimary },
    summaryValue: { ...typography.body, color: colors.textPrimary },
    summaryValueBold: { ...typography.h4, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xxs },
    couponRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xxs,
    },
    couponAppliedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primarySurface,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    couponAppliedText: { ...typography.captionMedium, color: colors.primary },
    couponSection: { paddingVertical: spacing.xxs, gap: spacing.xs },
    couponInputRow: { flexDirection: 'row', gap: spacing.xs },
    couponInput: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      ...typography.body,
      color: colors.textPrimary,
    },
    couponApplyBtn: {
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
    },
    couponApplyBtnDisabled: { backgroundColor: colors.surfaceMuted },
    couponApplyText: { ...typography.captionMedium, color: colors.textOnPrimary },
    couponApplyTextDisabled: { color: colors.textMuted },
    couponErrorText: { ...typography.caption, color: colors.danger },
    browseOffersBtn: { alignSelf: 'flex-start' },
    checkoutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadow.sm,
    },
    footerTotalLabel: { ...typography.caption, color: colors.textMuted },
    footerTotalValue: { ...typography.h3, color: colors.textPrimary },
    checkoutBtn: { paddingHorizontal: spacing.xl },
  });

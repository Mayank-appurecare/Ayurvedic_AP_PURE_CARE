import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { radius, shadow, spacing, typography } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { RatingStars } from './RatingStars';
import { PriceDisplay } from './PriceDisplay';
import { DiscountBadge } from './DiscountBadge';
import { QuantitySelector } from './QuantitySelector';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface Props {
  product: Product;
  onPress: () => void;
  style?: object;
}

export function ProductCard({ product, onPress, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, updateQuantity, quantityOf } = useCart();
  const wishlisted = isWishlisted(product.id);
  const variantId = product.variants[0]?.id;
  const quantity = variantId ? quantityOf(product.id, variantId) : 0;
  const outOfStock = product.stock <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      accessibilityLabel={product.name}
    >
      <View style={styles.imageWrap}>
        {/* API products carry no image URL. Fall back to a neutral placeholder
            rather than requesting an invented one. */}
        {product.images[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="leaf-outline" size={32} color={colors.primaryLight} />
          </View>
        )}
        <Pressable
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          style={styles.wishlistBtn}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={wishlisted ? colors.danger : colors.textSecondary}
          />
        </Pressable>
        {outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        <DiscountBadge percent={product.discountPercent} style={styles.discountBadge} />
      </View>
      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <RatingStars rating={product.rating} size={11} reviewCount={product.reviewCount} />
        <PriceDisplay price={product.price} mrp={product.mrp} size="sm" />
      </View>
      {quantity > 0 ? (
        // Wrapping Pressable exists only to stop the tap from also
        // triggering the card's own onPress (navigate to product detail) —
        // ProductCard already relies on this same stopPropagation idiom for
        // the wishlist button above.
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.qtyStepperWrap}>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => variantId && updateQuantity(product.id, variantId, quantity + 1)}
            onDecrease={() => variantId && updateQuantity(product.id, variantId, quantity - 1)}
            max={product.stock}
            size="sm"
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (variantId) addToCart(product.id, variantId);
          }}
          disabled={outOfStock}
          style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={outOfStock ? colors.textMuted : colors.primary} />
          <Text style={[styles.addBtnText, outOfStock && styles.addBtnTextDisabled]}>
            {outOfStock ? 'Notify Me' : 'Add'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadow.sm,
    },
    pressed: { opacity: 0.92 },
    imageWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceMuted },
    image: { width: '100%', height: '100%' },
    imageFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wishlistBtn: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      padding: 6,
      ...shadow.sm,
    },
    discountBadge: { position: 'absolute', top: spacing.xs, left: spacing.xs },
    outOfStockOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outOfStockText: { color: colors.textInverse, ...typography.captionMedium },
    info: { padding: spacing.sm, gap: 4 },
    brand: { ...typography.tiny, color: colors.textMuted, textTransform: 'uppercase' },
    name: { ...typography.body, color: colors.textPrimary, fontWeight: '600', minHeight: 36 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      margin: spacing.sm,
      marginTop: 0,
      paddingVertical: 8,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    addBtnDisabled: { borderColor: colors.border },
    addBtnText: { ...typography.captionMedium, color: colors.primary },
    addBtnTextDisabled: { color: colors.textMuted },
    qtyStepperWrap: {
      margin: spacing.sm,
      marginTop: 0,
      alignItems: 'center',
    },
  });

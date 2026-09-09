import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatPrice } from '../../utils/format';
import { Product, ProductVariant, Review } from '../../types';
import { ProductRepository } from '../../repositories/ProductRepository';
import { ReviewRepository } from '../../repositories/ReviewRepository';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

import { ProductImageGallery } from '../../components/ProductImageGallery';
import { RatingStars } from '../../components/RatingStars';
import { PriceDisplay } from '../../components/PriceDisplay';
import { QuantitySelector } from '../../components/QuantitySelector';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ReviewCard } from '../../components/ReviewCard';
import { ProductCard } from '../../components/ProductCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rte = RouteProp<RootStackParamList, 'ProductDetail'>;

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { star: number; count: number }[];
}

export function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rte>();
  const { productId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addToCart, cartCount } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [sampleReviews, setSampleReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);

  const [addedFeedback, setAddedFeedback] = useState(false);
  const toastOpacity = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(() => {
    setStatus('loading');
    ProductRepository.getById(productId)
      .then((result) => {
        if (!result) {
          setProduct(undefined);
          setStatus('ready');
          return;
        }
        setProduct(result);
        setSelectedVariant(result.variants[0]);
        setQuantity(1);
        setStatus('ready');

        ReviewRepository.getSummary(productId).then(setReviewSummary);
        ReviewRepository.getForProduct(productId).then((list) =>
          setSampleReviews(list.slice(0, 2))
        );
        ProductRepository.getRelated(productId).then(setRelatedProducts);
        ProductRepository.getFrequentlyBoughtTogether(productId).then(setFbtProducts);
      })
      .catch(() => setStatus('error'));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = () => {
    setAddedFeedback(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setAddedFeedback(false));
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addToCart(product.id, selectedVariant.id, quantity);
    showToast();
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    addToCart(product.id, selectedVariant.id, quantity);
    navigation.navigate('CheckoutAddress');
  };

  const handleAddAllFbt = () => {
    if (!product) return;
    addToCart(product.id, product.variants[0].id, 1);
    fbtProducts.forEach((p) => addToCart(p.id, p.variants[0].id, 1));
    showToast();
  };

  if (status === 'loading') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <TopBar
          onBack={() => navigation.goBack()}
          wishlisted={false}
          onToggleWishlist={() => {}}
          cartCount={cartCount}
          onCartPress={() => navigation.navigate('Cart')}
        />
        <LoadingState label="Loading product..." />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <TopBar
          onBack={() => navigation.goBack()}
          wishlisted={false}
          onToggleWishlist={() => {}}
          cartCount={cartCount}
          onCartPress={() => navigation.navigate('Cart')}
        />
        <ErrorState onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <TopBar
          onBack={() => navigation.goBack()}
          wishlisted={false}
          onToggleWishlist={() => {}}
          cartCount={cartCount}
          onCartPress={() => navigation.navigate('Cart')}
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Product not found"
          description="This product may have been removed or is no longer available."
          actionLabel="Back to Home"
          onAction={() => navigation.navigate('Main')}
        />
      </SafeAreaView>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const outOfStock = selectedVariant.stock <= 0;
  const lowStock = !outOfStock && selectedVariant.stock < 15;
  const maxQty = Math.min(selectedVariant.stock, 10) || 1;
  const fbtTotal =
    (selectedVariant.price ?? product.price) + fbtProducts.reduce((sum, p) => sum + p.price, 0);

  return (
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <TopBar
        onBack={() => navigation.goBack()}
        wishlisted={wishlisted}
        onToggleWishlist={() => toggleWishlist(product.id)}
        cartCount={cartCount}
        onCartPress={() => navigation.navigate('Cart')}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProductImageGallery images={product.images} />

        <View style={styles.heroSection}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Pressable
            onPress={() => navigation.navigate('Reviews', { productId })}
            style={styles.ratingRow}
            accessibilityRole="button"
            accessibilityLabel="View all reviews"
          >
            {product.reviewCount > 0 ? (
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} showValue />
            ) : (
              <Text style={styles.noRatingsText}>No ratings yet</Text>
            )}
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </Pressable>

          <PriceDisplay
            price={selectedVariant.price}
            mrp={selectedVariant.mrp}
            size="lg"
            showDiscountLabel
          />

          <Text
            style={[
              styles.stockText,
              outOfStock ? styles.stockOut : lowStock ? styles.stockLow : styles.stockIn,
            ]}
          >
            {outOfStock
              ? 'Out of Stock'
              : lowStock
                ? `Only ${selectedVariant.stock} left!`
                : 'In Stock'}
          </Text>

          {product.variants.length > 1 && (
            <View style={styles.variantSection}>
              <Text style={styles.subheading}>Select Variant</Text>
              <View style={styles.variantRow}>
                {product.variants.map((variant) => {
                  const active = variant.id === selectedVariant.id;
                  return (
                    <Pressable
                      key={variant.id}
                      onPress={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      style={[styles.variantChip, active && styles.variantChipActive]}
                    >
                      <Text style={[styles.variantLabel, active && styles.variantLabelActive]}>
                        {variant.label}
                      </Text>
                      <Text style={[styles.variantPrice, active && styles.variantLabelActive]}>
                        {formatPrice(variant.price)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.qtyRow}>
            <Text style={styles.subheading}>Quantity</Text>
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              max={maxQty}
            />
          </View>

          <View style={styles.ctaRow}>
            <SecondaryButton
              label={addedFeedback ? 'Added ✓' : 'Add to Cart'}
              onPress={handleAddToCart}
              disabled={outOfStock}
              style={styles.ctaBtn}
            />
            <PrimaryButton
              label="Buy Now"
              onPress={handleBuyNow}
              disabled={outOfStock}
              style={styles.ctaBtn}
            />
          </View>
        </View>

        <InfoSection title="Description">
          <Text style={styles.paragraph}>{product.description}</Text>
        </InfoSection>

        <InfoSection title="Benefits">
          {product.benefits.map((benefit, index) => (
            <View key={index} style={styles.bulletRow}>
              <Ionicons name="leaf" size={14} color={colors.primary} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>{benefit}</Text>
            </View>
          ))}
        </InfoSection>

        <InfoSection title="Ingredients">
          {product.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.bulletRow}>
              <Ionicons
                name="flask-outline"
                size={14}
                color={colors.primary}
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>{ingredient}</Text>
            </View>
          ))}
        </InfoSection>

        <InfoSection title="How to Use">
          {product.howToUse.map((step, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          ))}
        </InfoSection>

        <InfoSection title="Product Information">
          {product.productInfo.map((row, index) => (
            <View key={index} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </InfoSection>

        {product.faqs.length > 0 && (
          <InfoSection title="Frequently Asked Questions">
            {product.faqs.map((faq, index) => (
              <FaqRow key={index} question={faq.question} answer={faq.answer} />
            ))}
          </InfoSection>
        )}

        <InfoSection title="Ratings & Reviews">
          {reviewSummary && (
            <View style={styles.reviewSummaryRow}>
              <View style={styles.reviewAverageBlock}>
                <Text style={styles.reviewAverageNumber}>{reviewSummary.average.toFixed(1)}</Text>
                <RatingStars rating={reviewSummary.average} size={14} />
                <Text style={styles.reviewTotalText}>{reviewSummary.total} ratings</Text>
              </View>
              <View style={styles.reviewBarsBlock}>
                {reviewSummary.distribution.map((row) => (
                  <View key={row.star} style={styles.distRow}>
                    <Text style={styles.distLabel}>{row.star}★</Text>
                    <View style={styles.distTrack}>
                      <View
                        style={[
                          styles.distFill,
                          {
                            width: reviewSummary.total
                              ? `${(row.count / reviewSummary.total) * 100}%`
                              : '0%',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.distCount}>{row.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {sampleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          <SecondaryButton
            label={`See all ${reviewSummary?.total ?? 0} reviews`}
            onPress={() => navigation.navigate('Reviews', { productId })}
            style={styles.seeAllBtn}
          />
        </InfoSection>

        {relatedProducts.length > 0 && (
          <InfoSection title="Related Products">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railContent}
            >
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  onPress={() => navigation.push('ProductDetail', { productId: related.id })}
                  style={styles.railCard}
                />
              ))}
            </ScrollView>
          </InfoSection>
        )}

        {fbtProducts.length > 0 && (
          <InfoSection title="Frequently Bought Together">
            <View style={styles.fbtRow}>
              <FbtThumb image={product.images[0]} label={product.name} />
              {fbtProducts.map((p) => (
                <React.Fragment key={p.id}>
                  <Ionicons name="add" size={16} color={colors.textMuted} />
                  <FbtThumb image={p.images[0]} label={p.name} />
                </React.Fragment>
              ))}
            </View>
            <View style={styles.fbtFooter}>
              <Text style={styles.fbtTotal}>Total: {formatPrice(fbtTotal)}</Text>
              <PrimaryButton
                label="Add All to Cart"
                onPress={handleAddAllFbt}
                fullWidth={false}
                style={styles.fbtBtn}
              />
            </View>
          </InfoSection>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {addedFeedback && (
        <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.textOnPrimary} />
          <Text style={styles.toastText}>Added to cart</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function TopBar({
  onBack,
  wishlisted,
  onToggleWishlist,
  cartCount,
  onCartPress,
}: {
  onBack: () => void;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  cartCount: number;
  onCartPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={styles.topBarBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.topBarRight}>
        <Pressable
          onPress={onToggleWishlist}
          hitSlop={10}
          style={styles.topBarBtn}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={wishlisted ? colors.danger : colors.textPrimary}
          />
        </Pressable>
        <Pressable
          onPress={onCartPress}
          hitSlop={10}
          style={styles.topBarBtn}
          accessibilityRole="button"
          accessibilityLabel="Go to cart"
        >
          <Ionicons name="bag-outline" size={22} color={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.topBarBadge}>
              <Text style={styles.topBarBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.cardSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded((e) => !e)} style={styles.faqRow}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

function FbtThumb({ image, label }: { image: string; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.fbtThumbWrap}>
      <Image source={{ uri: image }} style={styles.fbtThumb} contentFit="cover" />
      <Text style={styles.fbtLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: spacing.xl },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xs,
    },
    topBarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.sm,
    },
    topBarRight: { flexDirection: 'row', gap: spacing.xs },
    topBarBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    topBarBadgeText: { color: colors.textInverse, fontSize: 9, fontWeight: '700' },
    heroSection: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    cardSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      padding: spacing.md,
      ...shadow.sm,
    },
    brand: { ...typography.tiny, color: colors.textMuted, textTransform: 'uppercase' },
    name: { ...typography.h3, color: colors.textPrimary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    noRatingsText: { ...typography.captionMedium, color: colors.textMuted },
    stockText: { ...typography.captionMedium, marginTop: 2 },
    stockIn: { color: colors.success },
    stockLow: { color: colors.warning },
    stockOut: { color: colors.danger },
    subheading: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
    variantSection: { marginTop: spacing.sm },
    variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    variantChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minWidth: 90,
    },
    variantChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
    variantLabel: { ...typography.captionMedium, color: colors.textPrimary },
    variantLabelActive: { color: colors.primary },
    variantPrice: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    qtyRow: { marginTop: spacing.md },
    ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    ctaBtn: { flex: 1 },
    sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.xs },
    paragraph: { ...typography.body, color: colors.textSecondary, lineHeight: 21 },
    bulletRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.xs,
      alignItems: 'flex-start',
    },
    bulletIcon: { marginTop: 3 },
    bulletText: { ...typography.body, color: colors.textSecondary, flex: 1 },
    stepNumber: { ...typography.bodyMedium, color: colors.primary, width: 20 },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    infoLabel: { ...typography.body, color: colors.textMuted, flex: 1 },
    infoValue: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    faqRow: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    faqQuestion: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    faqAnswer: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    reviewSummaryRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
    reviewAverageBlock: { alignItems: 'center', justifyContent: 'center', width: 90, gap: 4 },
    reviewAverageNumber: { ...typography.h1, color: colors.textPrimary },
    reviewTotalText: { ...typography.caption, color: colors.textMuted },
    reviewBarsBlock: { flex: 1, justifyContent: 'center', gap: 4 },
    distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    distLabel: { ...typography.tiny, color: colors.textSecondary, width: 22 },
    distTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
    },
    distFill: { height: '100%', backgroundColor: colors.star, borderRadius: 3 },
    distCount: { ...typography.tiny, color: colors.textMuted, width: 24, textAlign: 'right' },
    seeAllBtn: { marginTop: spacing.sm },
    railContent: { gap: spacing.sm, paddingRight: spacing.md },
    railCard: { width: 160 },
    fbtRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
    fbtThumbWrap: { width: 76, alignItems: 'center', gap: 4 },
    fbtThumb: {
      width: 60,
      height: 60,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    fbtLabel: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
    fbtFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    fbtTotal: { ...typography.bodyMedium, color: colors.textPrimary },
    fbtBtn: { paddingHorizontal: spacing.md },
    toast: {
      position: 'absolute',
      bottom: spacing.xl,
      alignSelf: 'center',
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      ...shadow.md,
    },
    toastText: { ...typography.captionMedium, color: colors.textOnPrimary },
  });

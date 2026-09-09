import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { getWindowWidth, radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';

import { SearchBar } from '../../components/SearchBar';
import { CategoryCard } from '../../components/CategoryCard';
import { ProductCard } from '../../components/ProductCard';
import { ArticleCard } from '../../components/ArticleCard';
import { ReviewCard } from '../../components/ReviewCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { AddressSelectorSheet } from '../../components/AddressSelectorSheet';

import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { ProductRepository } from '../../repositories/ProductRepository';
import { ArticleRepository } from '../../repositories/ArticleRepository';
import { ReviewRepository } from '../../repositories/ReviewRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Category, Concern, Product, Article, Review } from '../../types';
import { banners, trustBadges } from '../../data/banners';

// Mock unread-notifications indicator for the header bell — there is no
// backend/notification-read-state store yet, so this is a static demo count.
const MOCK_UNREAD_NOTIFICATIONS = 2;

// Banner card fills most of the screen width with a small peek of the next
// card, matching common promo-carousel conventions and staying responsive
// down to small phone widths (e.g. 320-390px).
const BANNER_CARD_WIDTH = Math.min(getWindowWidth() - spacing.md * 2 - 28, 360);
const BANNER_CARD_HEIGHT = Math.round(BANNER_CARD_WIDTH * 0.52);

// Home shows a short preview rail; the full list lives behind "See All". This
// caps only what the preview renders — the underlying data is always the whole
// API productList.
const HOME_PRODUCT_PREVIEW_COUNT = 6;

// CategoryProducts with neither a categoryId nor a concernId means "everything".
// That screen already provides the vertical grid, filter, sort and empty/error
// states, so it is reused rather than duplicated.
const ALL_PRODUCTS_PARAMS = { categoryId: '', categoryName: 'Products' } as const;

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeData {
  categories: Category[];
  concerns: Concern[];
  /** The REAL API productList. Never mock — see ProductRepository.getApiProducts. */
  products: Product[];
  articles: Article[];
  reviewHighlights: Review[];
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { cartCount } = useCart();
  const { selectedAddress, setSelectedAddress } = useCheckout();
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Default the delivery location to the customer's saved default address the
  // first time Home loads, so the pill shows a real address instead of the
  // static fallback text. Purely local/mock state — no backend.
  useEffect(() => {
    if (selectedAddress) return;
    UserRepository.getAddresses().then((addresses) => {
      const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (defaultAddress) setSelectedAddress(defaultAddress);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categories, concerns, products, articles] = await Promise.all([
        CategoryRepository.getAll(),
        CategoryRepository.getConcerns(),
        // API-only: returns [] rather than mock data when no catalog exists.
        ProductRepository.getApiProducts(),
        ArticleRepository.getAll(),
      ]);

      // Testimonials are still local demo content and are deliberately not tied
      // to the API product list, which carries no reviews.
      const reviewHighlights = await ReviewRepository.getRecent(3);

      setData({ categories, concerns, products, articles: articles.slice(0, 4), reviewHighlights });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch every time Home regains focus (not just on first mount) — a
  // review just written, or a wishlist/cart change, would otherwise never
  // show up here until the app fully reloaded. `data` already holds the
  // previous feed while this runs, so the screen doesn't flash back to the
  // loading state on a refocus, only on the very first load.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !data) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <LoadingState label="Loading AP Pure Care..." />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <ErrorState description="We couldn't load the home feed." onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            {/* AP Pure Care emblem, replacing the generic leaf glyph. */}
            <Image
              source={require('../../../assets/logo-mark.png')}
              style={styles.brandMark}
              contentFit="contain"
              accessibilityLabel="AP Pure Care"
            />
            <Text style={styles.brand}>AP Pure Care</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              hitSlop={10}
              style={styles.cartBtn}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              {MOCK_UNREAD_NOTIFICATIONS > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {MOCK_UNREAD_NOTIFICATIONS > 9 ? '9+' : MOCK_UNREAD_NOTIFICATIONS}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('CartTab')}
              hitSlop={10}
              style={styles.cartBtn}
              accessibilityRole="button"
              accessibilityLabel="Open cart"
            >
              <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.locationPill}
          onPress={() => setAddressSheetVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Change delivery location"
        >
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedAddress
              ? `Deliver to ${selectedAddress.city} ${selectedAddress.pincode}`
              : 'Deliver to Bengaluru 560001'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </Pressable>
        <View style={styles.searchWrap}>
          <SearchBar
            value=""
            onChangeText={() => {}}
            editable={false}
            placeholder="Search Ayurvedic products"
            onPressIn={() => navigation.navigate('Search')}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero banner carousel */}
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          snapToInterval={BANNER_CARD_WIDTH + spacing.sm}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.bannerList}
          ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.bannerCard}
              onPress={() =>
                item.targetCategoryId
                  ? navigation.navigate('CategoryProducts', { categoryId: item.targetCategoryId })
                  : navigation.navigate('Offers')
              }
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Image source={{ uri: item.image }} style={styles.bannerImage} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
                locations={[0, 0.5, 1]}
                style={styles.bannerOverlay}
              >
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.subtitle && (
                  <Text style={styles.bannerSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                )}
                {!!item.ctaLabel && (
                  <View style={styles.bannerCta}>
                    <Text style={styles.bannerCtaText}>{item.ctaLabel}</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.textOnPrimary} />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          )}
        />

        {/* Shop by Category */}
        <Section
          title="Shop by Category"
          onSeeAll={() => navigation.navigate('Main', { screen: 'CategoriesTab' })}
        >
          <FlatList
            data={data.categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.railPadding}
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() =>
                  navigation.navigate('CategoryProducts', {
                    categoryId: item.id,
                    categoryName: item.name,
                  })
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
          />
        </Section>

        {/* Shop by Concern */}
        <Section title="Shop by Concern">
          <FlatList
            data={data.concerns}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.railPadding}
            renderItem={({ item }) => (
              <Pressable
                style={styles.concernChip}
                onPress={() =>
                  navigation.navigate('CategoryProducts', {
                    categoryId: '',
                    categoryName: item.name,
                    concernId: item.id,
                  })
                }
                accessibilityRole="button"
              >
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                <Text style={styles.concernLabel}>{item.name}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.xs }} />}
          />
        </Section>

        {/* Products — a compact preview of the real API productList. The former
            "Best Sellers", "Featured Products" and "New Arrivals" rails were all
            driven by mock-only flags (isBestSeller / isFeatured / isNewArrival)
            that the API does not send, so they are gone rather than hidden.
            "See All" opens the full vertical grid. */}
        <ProductRail
          title="Products"
          products={data.products.slice(0, HOME_PRODUCT_PREVIEW_COUNT)}
          onSeeAll={() => navigation.navigate('CategoryProducts', ALL_PRODUCTS_PARAMS)}
          onPressProduct={(id) => navigation.navigate('ProductDetail', { productId: id })}
        />

        {/* Customer Reviews */}
        {data.reviewHighlights.length > 0 && (
          <Section title="What Our Customers Say">
            <View style={styles.reviewsWrap}>
              {data.reviewHighlights.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          </Section>
        )}

        {/* Articles */}
        <Section title="Ayurvedic Wisdom" onSeeAll={() => navigation.navigate('Articles')}>
          <FlatList
            data={data.articles}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.railPadding}
            renderItem={({ item }) => (
              <View style={styles.articleCardWrap}>
                <ArticleCard
                  article={item}
                  onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
                />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
          />
        </Section>

        {/* Trust badges */}
        <View style={styles.trustSection}>
          {trustBadges.map((badge) => (
            <View key={badge.id} style={styles.trustBadge}>
              <Ionicons name={badge.icon as any} size={22} color={colors.primary} />
              <Text style={styles.trustLabel}>{badge.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <AddressSelectorSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
        selectedAddressId={selectedAddress?.id}
        onSelect={setSelectedAddress}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} accessibilityRole="button">
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function ProductRail({
  title,
  products,
  onSeeAll,
  onPressProduct,
}: {
  title: string;
  products: Product[];
  onSeeAll?: () => void;
  onPressProduct: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // An empty list must stay visible: silently hiding the section would look
  // identical to "no products exist", and mock data must never stand in.
  if (!products.length) {
    return (
      <Section title={title}>
        <EmptyState
          icon="cube-outline"
          title="No products available right now."
          description="Product data will appear here once it is available from the server."
        />
      </Section>
    );
  }

  return (
    <Section title={title} onSeeAll={onSeeAll}>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.railPadding}
        renderItem={({ item }) => (
          <View style={styles.productCardWrap}>
            <ProductCard product={item} onPress={() => onPressProduct(item.id)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
      />
    </Section>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    // paddingTop matches paddingBottom so the row sits centred in its own
    // strip. SafeAreaView supplies the notch inset on top of this, but that
    // inset is 0 on web and on Android browsers, which left the bell and the
    // cart touching the very top edge of the screen.
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
    brandMark: { width: 28, height: 28 },
    brand: { ...typography.h4, color: colors.primary },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    cartBtn: { padding: spacing.xxs },
    cartBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    cartBadgeText: { color: colors.textInverse, fontSize: 9, fontWeight: '700' },
    locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    locationText: { ...typography.caption, color: colors.textSecondary },
    searchWrap: { marginTop: spacing.xxs },
    scrollContent: { paddingBottom: spacing.lg },
    bannerList: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    bannerCard: {
      width: BANNER_CARD_WIDTH,
      height: BANNER_CARD_HEIGHT,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
      ...shadow.sm,
    },
    bannerImage: { width: '100%', height: '100%' },
    bannerOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    // The gradient behind this text is a fixed dark scrim in every theme, so
    // the text must stay a fixed white too — textInverse flips to a dark
    // color in dark mode (it's meant for a surface that also flips), which
    // made this unreadable there.
    bannerTitle: { ...typography.h4, color: colors.textOnPrimary },
    bannerSubtitle: { ...typography.caption, color: colors.textOnPrimary, marginTop: 2 },
    bannerCta: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      marginTop: spacing.xs,
    },
    bannerCtaText: { ...typography.captionMedium, color: colors.textOnPrimary, fontWeight: '700' },
    section: { marginTop: spacing.lg },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    sectionTitle: { ...typography.h4, color: colors.textPrimary },
    seeAll: { ...typography.captionMedium, color: colors.primary },
    railPadding: { paddingHorizontal: spacing.md },
    productCardWrap: { width: 160 },
    concernChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    concernLabel: { ...typography.captionMedium, color: colors.textPrimary },
    reviewsWrap: {
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      borderRadius: radius.lg,
      ...shadow.sm,
    },
    articleCardWrap: { width: 220 },
    // Four equal columns, never wrapping. With a fixed 76px per badge the four
    // of them needed 340px of the 328px a 360px-wide phone has, so "Ethically
    // Sourced" dropped onto a second row on its own.
    trustSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    // flex: 1 shares the row evenly at any width; a long label wraps inside its
    // own column rather than pushing the badge out of the row.
    trustBadge: { flex: 1, alignItems: 'center', gap: 4 },
    trustLabel: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
  });

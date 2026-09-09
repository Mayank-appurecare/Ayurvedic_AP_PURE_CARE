import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Coupon, Offer } from '../../types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { OfferRepository } from '../../repositories/OfferRepository';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { AppHeader } from '../../components/AppHeader';
import { CouponCard } from '../../components/CouponCard';
import { LoadingState } from '../../components/LoadingState';

export function OffersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { subtotal } = useCart();
  const { appliedCoupon, setAppliedCoupon } = useCheckout();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorByCoupon, setErrorByCoupon] = useState<Record<string, string>>({});
  const [justAppliedId, setJustAppliedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([OfferRepository.getOffers(), OfferRepository.getCoupons()]).then(
      ([offerList, couponList]) => {
        setOffers(offerList);
        setCoupons(couponList);
        setLoading(false);
      }
    );
  }, []);

  const handleApply = async (coupon: Coupon) => {
    const result = await OfferRepository.validateCoupon(coupon.code, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setErrorByCoupon((prev) => ({ ...prev, [coupon.id]: '' }));
      // One-shot confetti trigger — cleared after the burst finishes playing,
      // so it never replays on an unrelated re-render.
      setJustAppliedId(coupon.id);
      setTimeout(() => {
        setJustAppliedId((current) => (current === coupon.id ? null : current));
      }, 900);
    } else {
      setErrorByCoupon((prev) => ({ ...prev, [coupon.id]: result.message }));
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Offers & Coupons" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading offers..." />
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <FlatList
                data={offers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.offersRow}
                renderItem={({ item }) => (
                  <View style={styles.offerCard}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.offerImage}
                      contentFit="cover"
                    />
                    <View style={styles.offerOverlay}>
                      {item.badge && (
                        <View style={styles.offerBadge}>
                          <Text style={styles.offerBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Text style={styles.offerTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.offerSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                )}
              />
              <Text style={styles.sectionTitle}>Available Coupons</Text>
            </View>
          }
          contentContainerStyle={[styles.content, styles.couponsList]}
          renderItem={({ item: coupon }) => (
            <View>
              <CouponCard
                coupon={coupon}
                showApply
                onApply={() => handleApply(coupon)}
                applied={appliedCoupon?.id === coupon.id}
                justApplied={justAppliedId === coupon.id}
              />
              {!!errorByCoupon[coupon.id] && (
                <Text style={styles.errorText}>{errorByCoupon[coupon.id]}</Text>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl },
    offersRow: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingTop: spacing.md },
    offerCard: {
      width: 260,
      height: 140,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
      ...shadow.sm,
    },
    offerImage: { ...StyleSheet.absoluteFill },
    offerOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      padding: spacing.sm,
      justifyContent: 'flex-end',
    },
    offerBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentGold,
      paddingHorizontal: spacing.xs,
      paddingVertical: 3,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    // Unlike the title/subtitle below, this badge's own background
    // (accentGold) genuinely gets lighter in dark mode, so textInverse's
    // theme-flip is the right pairing here, not a fixed white.
    offerBadgeText: { ...typography.tiny, color: colors.textInverse, fontWeight: '700' },
    // The scrim behind these is a fixed dark overlay in every theme, so the
    // text must stay a fixed white — textInverse flips to a dark color in
    // dark mode instead, which made this unreadable there.
    offerTitle: { ...typography.bodyMedium, color: colors.textOnPrimary },
    offerSubtitle: { ...typography.caption, color: colors.textOnPrimary, marginTop: 2 },
    sectionTitle: {
      ...typography.h4,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginLeft: spacing.md,
    },
    couponsList: { paddingHorizontal: spacing.md, gap: spacing.sm },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      marginTop: 4,
      marginLeft: spacing.xs,
    },
  });

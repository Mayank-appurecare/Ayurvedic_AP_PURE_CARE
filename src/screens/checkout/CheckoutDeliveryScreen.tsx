import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCheckout } from '../../context/CheckoutContext';
import { useCart } from '../../context/CartContext';
import { deliveryOptions, FREE_DELIVERY_THRESHOLD } from '../../data/checkoutOptions';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatPrice } from '../../utils/format';

export function CheckoutDeliveryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedDelivery, setSelectedDelivery } = useCheckout();
  const { subtotal } = useCart();
  const qualifiesForFreeStandard = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="Delivery Options" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>
            {qualifiesForFreeStandard
              ? 'Your order qualifies for free standard delivery.'
              : `Add items worth ${formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for free standard delivery.`}
          </Text>
        </View>

        <View style={styles.list}>
          {deliveryOptions.map((option) => {
            const selected = selectedDelivery.id === option.id;
            const isFree = option.price === 0 && qualifiesForFreeStandard;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedDelivery(option)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{option.name}</Text>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? colors.primary : colors.border}
                  />
                </View>
                <Text style={styles.cardDescription}>{option.description}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.etaChip}>
                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.etaText}>{option.etaLabel}</Text>
                  </View>
                  <Text style={styles.priceText}>{isFree ? 'FREE' : option.price === 0 ? 'FREE' : formatPrice(option.price)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Continue to Payment" onPress={() => navigation.navigate('CheckoutPayment')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.infoSurface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  noteText: { ...typography.caption, color: colors.info, flex: 1 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xxs,
    ...shadow.sm,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cardDescription: { ...typography.caption, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxs },
  etaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.sm },
  etaText: { ...typography.tiny, color: colors.textSecondary },
  priceText: { ...typography.bodyMedium, color: colors.textPrimary },
  footer: { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
});

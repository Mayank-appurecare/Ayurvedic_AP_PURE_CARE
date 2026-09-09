import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCheckout } from '../../context/CheckoutContext';
import { useCart } from '../../context/CartContext';
import { paymentMethods } from '../../data/checkoutOptions';
import { OrderRepository } from '../../repositories/OrderRepository';
import { OrderItem } from '../../types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatPrice } from '../../utils/format';

export function CheckoutPaymentScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    selectedAddress,
    selectedDelivery,
    appliedCoupon,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
  } = useCheckout();
  const { enrichedItems, subtotal, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<{
    number?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discountType === 'flat'
      ? appliedCoupon.discountValue
      : appliedCoupon.discountType === 'percent'
        ? Math.round((subtotal * appliedCoupon.discountValue) / 100)
        : 0
    : 0;
  const deliveryFee = selectedDelivery.price;
  const total = Math.max(subtotal - couponDiscount + deliveryFee, 0);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);

  const validateCard = (): boolean => {
    const digits = cardNumber.replace(/\s/g, '');
    const errors: typeof cardErrors = {};

    if (!/^\d{13,19}$/.test(digits)) {
      errors.number = 'Enter a valid card number';
    }

    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(cardExpiry.trim());
    if (!expiryMatch) {
      errors.expiry = 'Enter a valid expiry (MM/YY)';
    } else {
      const [, month, year] = expiryMatch;
      const expiryDate = new Date(2000 + Number(year), Number(month), 1);
      if (expiryDate <= new Date()) {
        errors.expiry = 'This card has expired';
      }
    }

    if (!/^\d{3}$/.test(cardCvv.trim())) {
      errors.cvv = 'Enter a valid CVV';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod || !selectedAddress) return;
    if (selectedMethod.type === 'card' && !validateCard()) return;
    setPlacing(true);
    try {
      const orderItems: OrderItem[] = enrichedItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        image: item.product.images[0],
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        price: item.unitPrice,
      }));
      const newOrder = await OrderRepository.placeOrder({
        items: orderItems,
        subtotal,
        discount: couponDiscount,
        deliveryFee,
        total,
        address: selectedAddress,
        paymentMethod: selectedMethod.label,
      });
      clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderConfirmation', params: { orderId: newOrder.id } }],
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="Payment" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
        <View style={styles.list}>
          {paymentMethods.map((method) => {
            const selected = selectedPaymentMethodId === method.id;
            return (
              <View key={method.id}>
                <Pressable
                  onPress={() => setSelectedPaymentMethodId(method.id)}
                  style={[styles.methodRow, selected && styles.methodRowSelected]}
                >
                  <View style={styles.methodIconWrap}>
                    <Ionicons
                      name={method.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{method.label}</Text>
                    {!!method.description && (
                      <Text style={styles.methodDescription}>{method.description}</Text>
                    )}
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? colors.primary : colors.border}
                  />
                </Pressable>
                {selected && method.type === 'card' && (
                  <View style={styles.cardForm}>
                    <TextInput
                      value={cardNumber}
                      onChangeText={(v) => {
                        setCardNumber(v);
                        setCardErrors((prev) => ({ ...prev, number: undefined }));
                      }}
                      placeholder="Card Number"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.cardInput, cardErrors.number && styles.cardInputError]}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    {!!cardErrors.number && (
                      <Text style={styles.cardErrorText}>{cardErrors.number}</Text>
                    )}
                    <View style={styles.cardRow}>
                      <View style={styles.cardInputHalf}>
                        <TextInput
                          value={cardExpiry}
                          onChangeText={(v) => {
                            setCardExpiry(v);
                            setCardErrors((prev) => ({ ...prev, expiry: undefined }));
                          }}
                          placeholder="MM/YY"
                          placeholderTextColor={colors.textMuted}
                          style={[styles.cardInput, cardErrors.expiry && styles.cardInputError]}
                          maxLength={5}
                        />
                        {!!cardErrors.expiry && (
                          <Text style={styles.cardErrorText}>{cardErrors.expiry}</Text>
                        )}
                      </View>
                      <View style={styles.cardInputHalf}>
                        <TextInput
                          value={cardCvv}
                          onChangeText={(v) => {
                            setCardCvv(v);
                            setCardErrors((prev) => ({ ...prev, cvv: undefined }));
                          }}
                          placeholder="CVV"
                          placeholderTextColor={colors.textMuted}
                          style={[styles.cardInput, cardErrors.cvv && styles.cardInputError]}
                          keyboardType="number-pad"
                          secureTextEntry
                          maxLength={3}
                        />
                        {!!cardErrors.cvv && (
                          <Text style={styles.cardErrorText}>{cardErrors.cvv}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.mockNote}>
                      This is a demo checkout — no real payment is processed.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <SummaryRow
            label={`Subtotal (${enrichedItems.length} items)`}
            value={formatPrice(subtotal)}
          />
          {couponDiscount > 0 && (
            <SummaryRow
              label="Coupon Discount"
              value={`- ${formatPrice(couponDiscount)}`}
              valueColor={colors.success}
            />
          )}
          <SummaryRow
            label="Delivery Fee"
            value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            valueColor={deliveryFee === 0 ? colors.success : undefined}
          />
          <View style={styles.divider} />
          <SummaryRow label="Total Payable" value={formatPrice(total)} bold />
        </View>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={`Place Order · ${formatPrice(total)}`}
          disabled={!selectedMethod}
          loading={placing}
          onPress={handlePlaceOrder}
        />
      </View>
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
    sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
    list: { gap: spacing.sm },
    methodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...shadow.sm,
    },
    methodRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
    methodIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodLabel: { ...typography.bodyMedium, color: colors.textPrimary },
    methodDescription: { ...typography.caption, color: colors.textMuted },
    cardForm: { padding: spacing.sm, gap: spacing.sm },
    cardInput: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      ...typography.body,
      color: colors.textPrimary,
    },
    cardRow: { flexDirection: 'row', gap: spacing.sm },
    cardInputHalf: { flex: 1 },
    cardInputError: { borderColor: colors.danger },
    cardErrorText: { ...typography.caption, color: colors.danger },
    mockNote: { ...typography.tiny, color: colors.textMuted, fontStyle: 'italic' },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      ...shadow.sm,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { ...typography.body, color: colors.textSecondary },
    summaryLabelBold: { ...typography.bodyMedium, color: colors.textPrimary },
    summaryValue: { ...typography.body, color: colors.textPrimary },
    summaryValueBold: { ...typography.h4, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.xxs },
    footer: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
  });

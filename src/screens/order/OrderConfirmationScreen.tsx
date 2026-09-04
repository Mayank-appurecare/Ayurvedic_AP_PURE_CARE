import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { OrderRepository } from '../../repositories/OrderRepository';
import { Order } from '../../types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { formatPrice } from '../../utils/format';

type Route = RouteProp<RootStackParamList, 'OrderConfirmation'>;

export function OrderConfirmationScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OrderRepository.getById(params.orderId).then((result) => {
      setOrder(result);
      setLoading(false);
    });
  }, [params.orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <LoadingState label="Confirming your order..." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState title="Order not found" description="We couldn't find this order." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={88} color={colors.success} />
        </View>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Thank you for shopping with Ojas Ayurveda.</Text>

        <View style={styles.detailsCard}>
          <DetailRow label="Order ID" value={`#${order.orderNumber}`} />
          <DetailRow label="Amount Paid" value={formatPrice(order.total)} />
          <DetailRow label="Payment Method" value={order.paymentMethod} />
          <DetailRow label="Estimated Delivery" value={order.deliveryEstimate ?? 'Arriving soon'} last />
        </View>

        <PrimaryButton
          label="Track Order"
          onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
          style={styles.button}
        />
        <SecondaryButton
          label="Continue Shopping"
          onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs, marginBottom: spacing.lg },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary, maxWidth: '60%' },
  button: { width: '100%', marginTop: spacing.sm },
});

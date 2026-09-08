import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { AddressCard } from '../../components/AddressCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { useCheckout } from '../../context/CheckoutContext';
import { UserRepository } from '../../repositories/UserRepository';
import { Address } from '../../types';
import { spacing } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';

export function CheckoutAddressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedAddress, setSelectedAddress } = useCheckout();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await UserRepository.getAddresses();
      setAddresses(result);
      if (!selectedAddress && result.length > 0) {
        setSelectedAddress(result.find((a) => a.isDefault) ?? result[0]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title="Select Delivery Address" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading addresses..." />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 ? (
            <EmptyState
              icon="location-outline"
              title="No saved addresses"
              description="Add a delivery address to continue."
            />
          ) : (
            <View style={styles.list}>
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  selected={selectedAddress?.id === address.id}
                  onSelect={() => setSelectedAddress(address)}
                  onEdit={() => navigation.navigate('AddEditAddress', { addressId: address.id })}
                />
              ))}
            </View>
          )}
          <SecondaryButton
            label="+ Add New Address"
            onPress={() => navigation.navigate('AddEditAddress')}
            style={styles.addBtn}
          />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          label="Deliver Here"
          disabled={!selectedAddress}
          onPress={() => navigation.navigate('CheckoutDelivery')}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    list: { gap: spacing.sm },
    addBtn: { marginTop: spacing.md },
    footer: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
  });

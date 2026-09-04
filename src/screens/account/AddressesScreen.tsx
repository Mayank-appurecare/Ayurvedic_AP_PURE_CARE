import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Address } from '../../types';
import { spacing } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { UserRepository } from '../../repositories/UserRepository';
import { AppHeader } from '../../components/AppHeader';
import { AddressCard } from '../../components/AddressCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';

export function AddressesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    UserRepository.getAddresses()
      .then(setAddresses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    await UserRepository.deleteAddress(pendingDeleteId);
    setPendingDeleteId(null);
    load();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="My Addresses" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <LoadingState label="Loading addresses..." />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No addresses saved"
          description="Add a delivery address to speed up checkout."
          actionLabel="Add New Address"
          onAction={() => navigation.navigate('AddEditAddress')}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              onEdit={() => navigation.navigate('AddEditAddress', { addressId: item.id })}
              onDelete={() => setPendingDeleteId(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListFooterComponent={
            <PrimaryButton
              label="+ Add New Address"
              onPress={() => navigation.navigate('AddEditAddress')}
              style={styles.addBtn}
            />
          }
        />
      )}

      <ConfirmationDialog
        visible={!!pendingDeleteId}
        title="Delete Address"
        description="Are you sure you want to remove this address?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  addBtn: { marginTop: spacing.sm },
});

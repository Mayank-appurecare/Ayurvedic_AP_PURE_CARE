import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Address } from '../types';
import { spacing } from '../theme';
import { useTheme, AppColors } from '../theme/ThemeContext';
import { UserRepository } from '../repositories/UserRepository';
import { BottomSheet } from './BottomSheet';
import { AddressCard } from './AddressCard';
import { SecondaryButton } from './SecondaryButton';
import { EmptyState } from './EmptyState';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedAddressId?: string;
  onSelect: (address: Address) => void;
}

export function AddressSelectorSheet({ visible, onClose, selectedAddressId, onSelect }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    UserRepository.getAddresses().then((result) => {
      setAddresses(result);
      setLoading(false);
    });
  }, [visible]);

  const handleAddNew = () => {
    onClose();
    navigation.navigate('AddEditAddress');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Deliver To"
      maxHeightPercent={75}
      footer={<SecondaryButton label="+ Add New Address" onPress={handleAddNew} />}
    >
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No saved addresses"
          description="Add an address to start ordering."
        />
      ) : (
        <View style={styles.list}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={address.id === selectedAddressId}
              onSelect={() => {
                onSelect(address);
                onClose();
              }}
            />
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.sm },
  loadingWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },
});

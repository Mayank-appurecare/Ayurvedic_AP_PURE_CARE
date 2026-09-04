import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LoadingState } from '../../components/LoadingState';
import { UserRepository } from '../../repositories/UserRepository';
import { Address } from '../../types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';

type Route = RouteProp<RootStackParamList, 'AddEditAddress'>;

const LABELS: Address['label'][] = ['Home', 'Office', 'Other'];

interface FormState {
  label: Address['label'];
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_FORM: FormState = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export function AddEditAddressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const addressId = route.params?.addressId;
  const isEditing = !!addressId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [existingIsDefault, setExistingIsDefault] = useState(false);

  useEffect(() => {
    if (!addressId) return;
    (async () => {
      const all = await UserRepository.getAddresses();
      const found = all.find((a) => a.id === addressId);
      if (found) {
        setForm({
          label: found.label,
          fullName: found.fullName,
          phone: found.phone,
          line1: found.line1,
          line2: found.line2 ?? '',
          city: found.city,
          state: found.state,
          pincode: found.pincode,
        });
        setExistingIsDefault(!!found.isDefault);
      }
      setLoading(false);
    })();
  }, [addressId]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!/^[\d+\-\s]{7,15}$/.test(form.phone.trim())) nextErrors.phone = 'Enter a valid phone number';
    if (!form.line1.trim()) nextErrors.line1 = 'Address line 1 is required';
    if (!form.city.trim()) nextErrors.city = 'City is required';
    if (!form.state.trim()) nextErrors.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) nextErrors.pincode = 'Enter a valid 6-digit pincode';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        label: form.label,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        isDefault: existingIsDefault,
      };
      if (isEditing && addressId) {
        await UserRepository.updateAddress({ ...payload, id: addressId });
      } else {
        await UserRepository.addAddress(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <AppHeader title="Edit Address" showBack onBackPress={() => navigation.goBack()} />
        <LoadingState label="Loading address..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <AppHeader title={isEditing ? 'Edit Address' : 'Add New Address'} showBack onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Address Type</Text>
          <View style={styles.labelRow}>
            {LABELS.map((label) => (
              <Pressable
                key={label}
                onPress={() => setField('label', label)}
                style={[styles.labelChip, form.label === label && styles.labelChipActive]}
              >
                <Text style={[styles.labelChipText, form.label === label && styles.labelChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <FormField label="Full Name" value={form.fullName} onChangeText={(v) => setField('fullName', v)} error={errors.fullName} />
          <FormField
            label="Phone Number"
            value={form.phone}
            onChangeText={(v) => setField('phone', v)}
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <FormField label="Address Line 1" value={form.line1} onChangeText={(v) => setField('line1', v)} error={errors.line1} />
          <FormField label="Address Line 2 (Optional)" value={form.line2} onChangeText={(v) => setField('line2', v)} />
          <FormField label="City" value={form.city} onChangeText={(v) => setField('city', v)} error={errors.city} />
          <FormField label="State" value={form.state} onChangeText={(v) => setField('state', v)} error={errors.state} />
          <FormField
            label="Pincode"
            value={form.pincode}
            onChangeText={(v) => setField('pincode', v)}
            error={errors.pincode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <PrimaryButton label="Save Address" onPress={handleSave} loading={saving} style={styles.saveBtn} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  maxLength?: number;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  sectionLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xxs },
  labelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  labelChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  labelChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  labelChipText: { ...typography.captionMedium, color: colors.textSecondary },
  labelChipTextActive: { color: colors.primary },
  fieldWrap: { gap: 4 },
  fieldLabel: { ...typography.captionMedium, color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger },
  saveBtn: { marginTop: spacing.md },
});

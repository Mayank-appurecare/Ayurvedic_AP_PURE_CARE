import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const initials = (name || 'G').trim().charAt(0).toUpperCase();

  const handleSave = () => {
    setSaving(true);
    // Mock save only — UserRepository has no update-profile endpoint yet, so
    // this simply simulates a network round trip; nothing is persisted beyond this screen.
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Profile Updated', 'Your changes have been saved for this session.');
    }, 800);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="My Profile" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </View>

        <Field
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
        />
        <Field
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
        />
        <Field
          label="Mobile Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your mobile number"
          keyboardType="phone-pad"
        />

        <PrimaryButton
          label="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        style={styles.input}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.h1, color: colors.primary },
    changePhoto: { ...typography.captionMedium, color: colors.primary, marginTop: spacing.xs },
    field: { marginBottom: spacing.md },
    fieldLabel: {
      ...typography.captionMedium,
      color: colors.textSecondary,
      marginBottom: spacing.xxs,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.textPrimary,
    },
    saveBtn: { marginTop: spacing.md },
  });

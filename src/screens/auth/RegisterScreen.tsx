import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

interface FormState {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormState, string>> & { form?: string };

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { register } = useAuth();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Enter your full name.';
    if (!form.mobile.trim() || form.mobile.trim().length < 10)
      nextErrors.mobile = 'Enter a valid 10-digit mobile number.';
    if (!form.email.trim() || !form.email.includes('@'))
      nextErrors.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.';
    if (form.confirmPassword !== form.password)
      nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (!acceptedTerms) {
      setErrors((prev) => ({ ...prev, form: 'Please accept the Terms & Conditions to continue.' }));
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigation.navigate('OTPVerification', { mode: 'register', mobile: form.mobile.trim() });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error instanceof Error ? error.message : 'Unable to register. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = acceptedTerms;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AP Pure Care for personalised wellness.</Text>

        <Field
          label="Full Name"
          value={form.fullName}
          onChangeText={(text) => updateField('fullName', text)}
          placeholder="Your full name"
          error={errors.fullName}
        />
        <Field
          label="Mobile Number"
          value={form.mobile}
          onChangeText={(text) => updateField('mobile', text)}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.mobile}
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(text) => updateField('email', text)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={(text) => updateField('password', text)}
          placeholder="At least 6 characters"
          secureTextEntry
          error={errors.password}
        />
        <Field
          label="Confirm Password"
          value={form.confirmPassword}
          onChangeText={(text) => updateField('confirmPassword', text)}
          placeholder="Re-enter your password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Pressable
          onPress={() => {
            setAcceptedTerms((prev) => !prev);
            if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
          }}
          style={styles.termsRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          accessibilityLabel="Accept terms and conditions"
        >
          <Ionicons
            name={acceptedTerms ? 'checkbox' : 'square-outline'}
            size={20}
            color={acceptedTerms ? colors.primary : colors.textMuted}
          />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Pressable>

        {!!errors.form && <Text style={styles.formError}>{errors.form}</Text>}

        <PrimaryButton
          label="Register"
          onPress={handleRegister}
          loading={loading}
          disabled={!canSubmit}
          style={styles.registerBtn}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel="Go to login"
          >
            <Text style={styles.footerLink}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
}: FieldProps) {
  const [showSecure, setShowSecure] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry={isPassword && !showSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowSecure((prev) => !prev)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showSecure ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: spacing.xxl, flexGrow: 1 },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  field: { marginBottom: spacing.md },
  label: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xxs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary, ...typography.body },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  termsText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  termsLink: { color: colors.primary, fontWeight: '600' },
  formError: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  registerBtn: { marginBottom: spacing.lg },
  footerRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyMedium, color: colors.primary },
});

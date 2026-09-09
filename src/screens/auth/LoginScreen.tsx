import React, { useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../context/AuthContext';
import { isAuthError } from '../../services/auth';
import {
  COUNTRY_DIAL_CODE,
  formatIndianMobile,
  sanitizeMobileInput,
  validateIndianMobile,
} from '../../utils/phone';
import { webOnly } from '../../utils/webStyle';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestOtp } = useAuth();

  // Stored as a bare 10-digit national number; the `+91` prefix is fixed UI.
  const [mobile, setMobile] = useState('');
  const [focused, setFocused] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  // Single gate for everything that reaches the field — typing, pasting, OS
  // autofill and speech input all arrive here. `sanitizeMobileInput` keeps only
  // 0-9 (dropping letters, spaces, +, -, ., commas and every other symbol) and
  // caps the result at 10 digits, so non-numeric characters can never be stored.
  const handleChangeMobile = (text: string) => {
    setMobile(sanitizeMobileInput(text));
    if (errors.mobile || errors.form) setErrors({});
  };

  // Validate on blur so the user is told what is wrong before they submit —
  // but never scold them for leaving an untouched field.
  const handleBlur = () => {
    setFocused(false);
    if (!mobile) return;
    const validationError = validateIndianMobile(mobile);
    if (validationError) setErrors((prev) => ({ ...prev, mobile: validationError }));
  };

  const handleSendOtp = async () => {
    const validationError = validateIndianMobile(mobile);
    if (validationError) {
      setErrors({ mobile: validationError });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const challenge = await requestOtp(mobile);
      navigation.navigate('OTPVerification', { mode: 'login', mobile, challenge });
    } catch (error) {
      const message = isAuthError(error)
        ? error.message
        : 'Could not start verification. Please check your connection and try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* This screen is pushed from Welcome, Account and Register, so it
              needs a way out. Android's hardware back covers it; iOS and web
              have nothing without this. */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to continue your wellness journey.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <View
              style={[
                styles.inputRow,
                focused && styles.inputRowFocused,
                !!errors.mobile && styles.inputRowError,
              ]}
            >
              <View style={styles.dialCodeWrap}>
                <Text style={styles.dialCode}>{COUNTRY_DIAL_CODE}</Text>
              </View>
              <View style={styles.dialDivider} />
              <TextInput
                value={formatIndianMobile(mobile)}
                onChangeText={handleChangeMobile}
                onFocus={() => setFocused(true)}
                onBlur={handleBlur}
                onSubmitEditing={handleSendOtp}
                placeholder="98765 43210"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                // number-pad / numeric show a digits-only keypad. "phone-pad"
                // and inputMode "tel" would also offer + * # , . ; keys.
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="done"
                // Deliberately no maxLength: it counts RAW characters, so it
                // truncated a paste like "+91 98765 43210" before the digit
                // filter ran and produced the wrong number. The 10-digit cap is
                // enforced in handleChangeMobile instead.
                accessibilityLabel="Mobile number"
                editable={!loading}
              />
            </View>
            {!!errors.mobile ? (
              <Text style={styles.errorText}>{errors.mobile}</Text>
            ) : (
              <Text style={styles.helperText}>
                We&apos;ll send a 6-digit verification code to this number.
              </Text>
            )}
          </View>

          {!!errors.form && (
            <View style={styles.formErrorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.formErrorText}>{errors.form}</Text>
            </View>
          )}

          {/* Intentionally not disabled while the number is invalid: a dead
              button tells the user nothing. Pressing it surfaces the exact
              validation message instead. */}
          <PrimaryButton
            label="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            style={styles.submitBtn}
          />

          <Text style={styles.legalText}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <SecondaryButton
              label="Google"
              icon={<Ionicons name="logo-google" size={16} color={colors.primary} />}
              onPress={() => setErrors({ form: 'Social login is a mock UI for this demo.' })}
              style={styles.socialBtn}
            />
            <SecondaryButton
              label="Apple"
              icon={<Ionicons name="logo-apple" size={16} color={colors.primary} />}
              onPress={() => setErrors({ form: 'Social login is a mock UI for this demo.' })}
              style={styles.socialBtn}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    // paddingTop is applied inline from the safe-area inset; a fixed value sat
    // under the notch on some devices and left too much room on others.
    scrollContent: { flexGrow: 1, padding: spacing.lg },
    backBtn: {
      alignSelf: 'flex-start',
      padding: spacing.xxs,
      marginLeft: -spacing.xxs,
      marginBottom: spacing.sm,
    },
    // Caps the line length on tablets and in a desktop browser window.
    container: { width: '100%', maxWidth: 480, alignSelf: 'center' },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xxs,
      marginBottom: spacing.xl,
    },
    field: { marginBottom: spacing.lg },
    label: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xxs },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
    },
    inputRowFocused: { borderColor: colors.primary },
    inputRowError: { borderColor: colors.danger },
    dialCodeWrap: { paddingVertical: spacing.sm },
    dialCode: { ...typography.bodyMedium, color: colors.textPrimary },
    dialDivider: {
      width: 1,
      alignSelf: 'stretch',
      marginVertical: spacing.xs,
      marginHorizontal: spacing.sm,
      backgroundColor: colors.divider,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      ...typography.bodyLg,
      letterSpacing: 0.5,
      // Removes the focus ring react-native-web adds on top of our own styling.
      ...webOnly({ outlineStyle: 'none' }),
    },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
    errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
    formErrorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.dangerSurface,
      borderRadius: radius.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.md,
    },
    formErrorText: { ...typography.caption, color: colors.danger, flex: 1 },
    submitBtn: { marginBottom: spacing.sm },
    legalText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { ...typography.caption, color: colors.textMuted },
    socialRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
    socialBtn: { flex: 1 },
  });

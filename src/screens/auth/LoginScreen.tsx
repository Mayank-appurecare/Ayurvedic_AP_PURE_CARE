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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useAuth } from '../../context/AuthContext';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!identifier.trim()) nextErrors.identifier = 'Enter your mobile number or email.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors((prev) => ({ ...prev, form: undefined }));
    try {
      await login(identifier.trim(), password);
      navigation.replace('Main');
    } catch (error) {
      setErrors((prev) => ({ ...prev, form: error instanceof Error ? error.message : 'Unable to login. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue your wellness journey.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Mobile Number or Email</Text>
          <TextInput
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
            }}
            placeholder="e.g. 98765 43210 or you@example.com"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, errors.identifier && styles.inputError]}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {!!errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, errors.password && styles.inputError]}>
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <Pressable
          onPress={() => setShowForgotDialog(true)}
          style={styles.forgotBtn}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        {!!errors.form && <Text style={[styles.errorText, styles.formError]}>{errors.form}</Text>}

        <PrimaryButton label="Login" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <SecondaryButton
            label="Google"
            icon={<Ionicons name="logo-google" size={16} color={colors.primary} />}
            onPress={() => setErrors((prev) => ({ ...prev, form: 'Social login is a mock UI for this demo.' }))}
            style={styles.socialBtn}
          />
          <SecondaryButton
            label="Apple"
            icon={<Ionicons name="logo-apple" size={16} color={colors.primary} />}
            onPress={() => setErrors((prev) => ({ ...prev, form: 'Social login is a mock UI for this demo.' }))}
            style={styles.socialBtn}
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showForgotDialog}
        title="Forgot Password"
        description="This is a demo app with mock authentication. In a production app, a reset link would be sent to your registered email or mobile number."
        confirmLabel="Got it"
        cancelLabel="Close"
        onConfirm={() => setShowForgotDialog(false)}
        onCancel={() => setShowForgotDialog(false)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: spacing.xxxl, flexGrow: 1 },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xxs, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  label: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xxs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.body,
  },
  inputError: { borderColor: colors.danger },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  passwordInput: { flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary, ...typography.body },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
  formError: { textAlign: 'center', marginBottom: spacing.sm },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { ...typography.captionMedium, color: colors.primary },
  loginBtn: { marginBottom: spacing.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { ...typography.caption, color: colors.textMuted },
  socialRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  socialBtn: { flex: 1 },
});

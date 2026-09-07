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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';

export function AdminLoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim() || !email.includes('@')) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 4) {
      nextErrors.password = 'Password must be at least 4 characters.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    // Mock authentication — no real backend. Any well-formed email/password is accepted.
    setTimeout(() => {
      setLoading(false);
      navigation.replace('AdminDashboard');
    }, 500);
  };

  const handleBackToCustomerApp = () => {
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).goBack();
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Ionicons name="leaf" size={32} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.title}>AP Pure Care</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Manage products, orders and more.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="admin@ojas.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="Admin email address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  secureTextEntry
                  accessibilityLabel="Admin password"
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <PrimaryButton label="Sign In" onPress={handleSignIn} loading={loading} style={styles.signInBtn} />

            <View style={styles.demoBox}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.demoText}>Demo credentials: admin@ojas.com / admin123</Text>
            </View>
          </View>

          <Pressable onPress={handleBackToCustomerApp} style={styles.backLink} accessibilityRole="button" accessibilityLabel="Back to customer app">
            <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
            <Text style={styles.backLinkText}>Back to Customer App</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminSidebar },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.adminAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textInverse },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h4, color: colors.textPrimary },
  cardSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  field: { gap: spacing.xxs },
  label: { ...typography.captionMedium, color: colors.textPrimary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 48,
    backgroundColor: colors.surface,
  },
  inputWrapError: { borderColor: colors.danger },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, height: '100%' },
  errorText: { ...typography.caption, color: colors.danger },
  signInBtn: { marginTop: spacing.sm },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  demoText: { ...typography.tiny, color: colors.textMuted, flex: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xl },
  backLinkText: { ...typography.captionMedium, color: colors.textSecondary },
});

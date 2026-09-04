import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { UserRepository } from '../../repositories/UserRepository';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

export function OTPVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OTPVerification'>>();
  const { mode, mobile } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const otp = digits.join('');

  const handleChangeDigit = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    if (!sanitized) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    next[index] = sanitized.slice(-1);
    setDigits(next);
    setError('');
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      setError('Please enter the complete 4-digit OTP.');
      triggerShake();
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await UserRepository.verifyOtp(otp);
      setVerified(true);
      setTimeout(() => navigation.replace('Main'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
      triggerShake();
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await UserRepository.sendOtp(mobile);
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
      </View>

      <Text style={styles.title}>Verify Your {mode === 'register' ? 'Number' : 'Login'}</Text>
      <Text style={styles.subtitle}>
        Enter the 4-digit code sent to{'\n'}
        <Text style={styles.mobile}>{mobile || 'your mobile number'}</Text>
      </Text>

      <Animated.View style={[styles.otpRow, { transform: [{ translateX: shake }] }]}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(value) => handleChangeDigit(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.otpBox, !!error && styles.otpBoxError, verified && styles.otpBoxSuccess]}
            editable={!verified}
          />
        ))}
      </Animated.View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {verified && (
        <View style={styles.successRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.successText}>Verified successfully!</Text>
        </View>
      )}

      <Text style={styles.demoHint}>Demo OTP: 1234</Text>

      <PrimaryButton label={verified ? 'Verified' : 'Verify'} onPress={handleVerify} loading={verifying} disabled={verified} style={styles.verifyBtn} />

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>Resend OTP in 00:{secondsLeft.toString().padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={handleResend} disabled={resending} accessibilityRole="button" accessibilityLabel="Resend OTP">
            <Text style={styles.resendActive}>{resending ? 'Sending…' : 'Resend OTP'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xxl, alignItems: 'center' },
  backBtn: { position: 'absolute', top: spacing.xxl, left: spacing.lg },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  mobile: { color: colors.textPrimary, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpBoxError: { borderColor: colors.danger },
  otpBoxSuccess: { borderColor: colors.success, backgroundColor: colors.successSurface },
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.xs },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginBottom: spacing.xs },
  successText: { ...typography.captionMedium, color: colors.success },
  demoHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xl },
  verifyBtn: { width: '100%', marginBottom: spacing.lg },
  resendRow: { alignItems: 'center' },
  resendMuted: { ...typography.body, color: colors.textMuted },
  resendActive: { ...typography.bodyMedium, color: colors.primary },
});

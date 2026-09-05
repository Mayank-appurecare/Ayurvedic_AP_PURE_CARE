import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { OTP_LENGTH, OtpChallenge, authService, isAuthError } from '../../services/auth';
import { maskIndianMobile } from '../../utils/phone';
import { webOnly } from '../../utils/webStyle';

const EMPTY_DIGITS = Array<string>(OTP_LENGTH).fill('');

/** Formats a remaining-seconds count as `m:ss` (or `0:ss` under a minute). */
function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function OTPVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OTPVerification'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestOtp, resendOtp, verifyOtp } = useAuth();

  const { mode, mobile } = route.params;

  const [challenge, setChallenge] = useState<OtpChallenge | null>(route.params.challenge ?? null);
  const [digits, setDigits] = useState<string[]>(EMPTY_DIGITS);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  // Only used when the screen has to create its own challenge on mount.
  const [preparing, setPreparing] = useState(!route.params.challenge);
  const [now, setNow] = useState(() => Date.now());

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;
  const hasRequestedRef = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    []
  );

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  const secondsUntilResend = challenge
    ? Math.max(0, Math.ceil((challenge.resendAvailableAt - now) / 1000))
    : 0;
  const canResend = !!challenge && secondsUntilResend === 0 && !resending && !verified;
  const isExpired = !!challenge && now > challenge.expiresAt;

  // Single 1s tick drives both the resend countdown and the expiry notice.
  useEffect(() => {
    if (verified) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [verified]);

  // Fallback path: a caller navigated here without requesting a code first.
  useEffect(() => {
    if (route.params.challenge || hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const created = await requestOtp(mobile);
        if (!cancelled) setChallenge(created);
      } catch (err) {
        if (!cancelled) {
          setError(
            isAuthError(err) ? err.message : 'Could not send a verification code. Please go back and try again.'
          );
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mobile, requestOtp, route.params.challenge]);

  const triggerShake = useCallback(() => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  const resetInput = useCallback(() => {
    setDigits(EMPTY_DIGITS);
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * Handles typing, replacing and pasting. A paste (or an autofilled SMS code)
   * arrives as one multi-character change, so it is spread across the boxes.
   */
  const handleChangeDigit = (index: number, text: string) => {
    let incoming = text.replace(/\D/g, '');
    // A controlled 1-char box reports "old + new" when typed into while filled.
    if (incoming.length > 1 && incoming[0] === digits[index]) {
      incoming = incoming.slice(1);
    }

    if (error) setError('');

    if (!incoming) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const next = [...digits];
    for (let i = 0; i < incoming.length && index + i < OTP_LENGTH; i += 1) {
      next[index + i] = incoming[i];
    }
    setDigits(next);

    const lastFilled = Math.min(index + incoming.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') return;
    if (digits[index]) return;
    if (index === 0) return;
    const next = [...digits];
    next[index - 1] = '';
    setDigits(next);
    inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    if (!challenge) return;
    if (!isComplete) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      triggerShake();
      return;
    }

    setVerifying(true);
    setError('');
    try {
      await verifyOtp(challenge.challengeId, code);
      setVerified(true);
      // Brief success state before handing off to the app's existing navigation.
      successTimerRef.current = setTimeout(() => navigation.replace('Main'), 700);
    } catch (err) {
      setError(isAuthError(err) ? err.message : 'Could not verify the code. Please try again.');
      triggerShake();
      resetInput();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!challenge || !canResend) return;
    setResending(true);
    setError('');
    try {
      const refreshed = await resendOtp(challenge.challengeId);
      setChallenge(refreshed);
      setNow(Date.now());
      resetInput();
    } catch (err) {
      setError(isAuthError(err) ? err.message : 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeNumber = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  };

  const showDevPanel = authService.isMock && !!challenge?.devCode;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            onPress={handleChangeNumber}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
          </View>

          <Text style={styles.title}>Verify Your {mode === 'register' ? 'Number' : 'Login'}</Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH}-digit code for{'\n'}
            <Text style={styles.mobile}>{maskIndianMobile(mobile)}</Text>
          </Text>

          {preparing ? (
            <View style={styles.preparingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.preparingText}>Preparing verification…</Text>
            </View>
          ) : (
            <>
              <Animated.View style={[styles.otpRow, { transform: [{ translateX: shake }] }]}>
                {digits.map((digit, index) => (
                  <TextInput
                    // Fixed-length array of positional inputs; index is the identity.
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(text) => handleChangeDigit(index, text)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                    textContentType="oneTimeCode"
                    style={[
                      styles.otpBox,
                      !!digit && styles.otpBoxFilled,
                      !!error && styles.otpBoxError,
                      verified && styles.otpBoxSuccess,
                    ]}
                    editable={!verified && !verifying}
                    selectTextOnFocus
                    accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  />
                ))}
              </Animated.View>

              {!!error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {!error && isExpired && !verified && (
                <View style={styles.errorRow}>
                  <Ionicons name="time-outline" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>This code has expired. Please request a new one.</Text>
                </View>
              )}

              {verified && (
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.successText}>Verified successfully!</Text>
                </View>
              )}

              {showDevPanel && (
                <View style={styles.devPanel}>
                  <View style={styles.devHeaderRow}>
                    <Ionicons name="construct-outline" size={14} color={colors.warning} />
                    <Text style={styles.devHeader}>Development mode — no SMS was sent</Text>
                  </View>
                  <Text style={styles.devBody}>
                    No OTP provider is connected yet. This randomly generated code exists only in this
                    browser/app session so the flow can be tested.
                  </Text>
                  <Text style={styles.devCode} selectable>
                    {challenge?.devCode}
                  </Text>
                </View>
              )}

              {/* Only disabled once verified / before a challenge exists. An
                  incomplete code is reported as an error, not by a dead button. */}
              <PrimaryButton
                label={verified ? 'Verified' : 'Verify OTP'}
                onPress={handleVerify}
                loading={verifying}
                disabled={verified || !challenge}
                style={styles.verifyBtn}
              />

              <View style={styles.resendRow}>
                {canResend ? (
                  <Pressable
                    onPress={handleResend}
                    accessibilityRole="button"
                    accessibilityLabel="Resend OTP"
                    hitSlop={8}
                  >
                    <Text style={styles.resendActive}>Resend OTP</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.resendMuted}>
                    {resending
                      ? 'Sending a new code…'
                      : `Resend OTP in ${formatCountdown(secondsUntilResend)}`}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={handleChangeNumber}
                disabled={verified}
                style={styles.changeNumberBtn}
                accessibilityRole="button"
                accessibilityLabel="Change mobile number"
                hitSlop={8}
              >
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.changeNumberText}>Change mobile number</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  // Caps the layout width on tablets and in a desktop browser window.
  container: { width: '100%', maxWidth: 480, alignSelf: 'center', alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', padding: spacing.xxs, marginLeft: -spacing.xxs },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  mobile: { color: colors.textPrimary, fontWeight: '600' },
  preparingWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  preparingText: { ...typography.body, color: colors.textSecondary },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    width: '100%',
    // Boxes are capped at 56px wide, so centre the leftover space on wide
    // screens instead of letting them pack to the left.
    justifyContent: 'center',
  },
  otpBox: {
    flex: 1,
    maxWidth: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    // Removes the focus ring react-native-web adds on top of our own styling.
    ...webOnly({ outlineStyle: 'none' }),
  },
  otpBoxFilled: { borderColor: colors.primaryLight },
  otpBoxError: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  otpBoxSuccess: { borderColor: colors.success, backgroundColor: colors.successSurface },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  errorText: { ...typography.caption, color: colors.danger, flexShrink: 1 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginBottom: spacing.xs },
  successText: { ...typography.captionMedium, color: colors.success },
  devPanel: {
    width: '100%',
    backgroundColor: colors.warningSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentSand,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  devHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  devHeader: { ...typography.captionMedium, color: colors.warning, flexShrink: 1 },
  devBody: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  devCode: {
    ...typography.h3,
    color: colors.textPrimary,
    letterSpacing: 6,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  verifyBtn: { width: '100%', marginBottom: spacing.md },
  resendRow: { alignItems: 'center', minHeight: 24, justifyContent: 'center' },
  resendMuted: { ...typography.body, color: colors.textMuted },
  resendActive: { ...typography.bodyMedium, color: colors.primary },
  changeNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeNumberText: { ...typography.bodyMedium, color: colors.textSecondary },
});

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark, setIsDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [promoEmails, setPromoEmails] = useState(false);

  const showLegal = (title: string) => {
    Alert.alert(
      title,
      'This is placeholder legal copy for the Ojas Ayurveda demo app. In a production build, this would contain the full text.'
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Settings" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Push Notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <ToggleRow label="Order Updates via SMS" value={smsUpdates} onValueChange={setSmsUpdates} />
          <ToggleRow label="Promotional Emails" value={promoEmails} onValueChange={setPromoEmails} />
          <ToggleRow
            label="Dark Mode"
            value={isDark}
            onValueChange={setIsDark}
            caption={isDark ? 'Dark theme is on' : 'Light theme is on'}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <InfoRow label="App Version" value="1.0.0" />
          <Pressable style={[styles.row, styles.rowDivider]} onPress={() => showLegal('Terms & Conditions')}>
            <Text style={styles.rowLabel}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => showLegal('Privacy Policy')}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  disabled,
  caption,
  isLast,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  caption?: string;
  isLast?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
        {caption && <Text style={styles.rowCaption}>{caption}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.row, styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.captionMedium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    marginLeft: spacing.xxs,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, gap: spacing.sm },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  rowLabelDisabled: { color: colors.textMuted },
  rowCaption: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  rowValue: { ...typography.body, color: colors.textSecondary },
});

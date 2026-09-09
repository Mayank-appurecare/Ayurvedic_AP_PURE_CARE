import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { PrimaryButton } from '../../components/PrimaryButton';

interface Row {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return initials.join('') || '?';
}

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, logout } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const isGuest = !user || user.isGuest;

  const activityRows: Row[] = [
    {
      icon: 'person-outline',
      label: 'My Profile',
      onPress: () => navigation.navigate('AccountProfile'),
    },
    { icon: 'receipt-outline', label: 'My Orders', onPress: () => navigation.navigate('MyOrders') },
    { icon: 'heart-outline', label: 'Wishlist', onPress: () => navigation.navigate('Wishlist') },
    {
      icon: 'location-outline',
      label: 'Addresses',
      onPress: () => navigation.navigate('Addresses'),
    },
    { icon: 'star-outline', label: 'My Reviews', onPress: () => navigation.navigate('MyReviews') },
    {
      icon: 'pricetag-outline',
      label: 'Offers & Coupons',
      onPress: () => navigation.navigate('Offers'),
    },
  ];

  const supportRows: Row[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    { icon: 'settings-outline', label: 'Settings', onPress: () => navigation.navigate('Settings') },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  const handleConfirmLogout = async () => {
    setLogoutVisible(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    // No 'bottom' edge: this screen only ever renders inside the bottom tab
    // navigator, whose own tab bar already reserves the device's bottom
    // safe-area inset — adding it again here left a redundant blank strip
    // between the content and the tab bar.
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>My Account</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{isGuest ? 'G' : getInitials(user?.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {isGuest ? 'Guest User' : user?.name}
            </Text>
            {isGuest ? (
              <Text style={styles.profileMeta} numberOfLines={1}>
                Login to unlock all features
              </Text>
            ) : (
              <>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {user?.email}
                </Text>
                <Text style={styles.profileMeta} numberOfLines={1}>
                  {user?.phone}
                </Text>
              </>
            )}
          </View>
        </View>

        {isGuest && (
          <PrimaryButton
            label="Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginBtn}
          />
        )}

        <Section title="My Activity" rows={activityRows} />
        <Section title="Support & Settings" rows={supportRows} />

        <Pressable
          style={({ pressed }) => [styles.logoutRow, pressed && styles.rowPressed]}
          onPress={() => setLogoutVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.versionText}>AP Pure Care • v1.0.0</Text>
      </ScrollView>

      <ConfirmationDialog
        visible={logoutVisible}
        title="Logout"
        description="Are you sure you want to logout of your account?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutVisible(false)}
      />
    </SafeAreaView>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {rows.map((row, index) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              index !== rows.length - 1 && styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={row.label}
          >
            <View style={styles.rowIconWrap}>
              <Ionicons name={row.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    screenTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.sm,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.h3, color: colors.primary },
    profileName: { ...typography.h4, color: colors.textPrimary },
    profileMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    loginBtn: { marginTop: spacing.sm },
    section: { marginTop: spacing.lg },
    sectionTitle: {
      ...typography.captionMedium,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      marginLeft: spacing.xxs,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadow.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    rowPressed: { backgroundColor: colors.surfaceMuted },
    rowIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.sm,
    },
    logoutText: { ...typography.bodyMedium, color: colors.danger },
    versionText: {
      ...typography.tiny,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });

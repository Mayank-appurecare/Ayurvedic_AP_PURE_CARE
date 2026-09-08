import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { formatDateTime } from '../../utils/format';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { AdminSidebarNav } from '../../components/AdminSidebarNav';

const AUDIENCES = ['All Customers', 'Order Updates Segment', 'New Customers'] as const;
type Audience = (typeof AUDIENCES)[number];

interface SentNotification {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  sentAt: string;
}

export function AdminNotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('All Customers');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentNotification[]>([]);

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const entry: SentNotification = {
        id: `notif-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        audience,
        sentAt: new Date().toISOString(),
      };
      setHistory((prev) => [entry, ...prev]);
      setTitle('');
      setMessage('');
      setSending(false);
    }, 500);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open admin menu"
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.demoNoticeText}>
            This is a demo broadcast log. No real push notifications are sent — messages are only
            recorded below.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Compose Notification</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Immunity Season Sale is live!"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel="Notification title"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Get up to 25% off on immunity boosters this week only."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Notification message"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Audience</Text>
            <View style={styles.chipsWrap}>
              {AUDIENCES.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setAudience(a)}
                  style={[styles.chip, audience === a && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={a}
                >
                  <Text style={[styles.chipLabel, audience === a && styles.chipLabelActive]}>
                    {a}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <PrimaryButton
            label="Send Notification"
            onPress={handleSend}
            disabled={!canSend}
            loading={sending}
            icon={<Ionicons name="send-outline" size={16} color={colors.textOnPrimary} />}
            style={{ marginTop: spacing.xs }}
          />
        </View>

        <Text style={styles.sectionTitle}>Sent Notifications</Text>
        {history.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="No notifications sent yet"
            description="Composed broadcasts will appear here."
          />
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.audienceChip}>
                  <Text style={styles.audienceChipText}>{item.audience}</Text>
                </View>
              </View>
              <Text style={styles.historyMessage}>{item.message}</Text>
              <Text style={styles.historyTimestamp}>{formatDateTime(item.sentAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <AdminSidebarNav
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminNotifications"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.adminBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.infoSurface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  demoNoticeText: { ...typography.caption, color: colors.info, flex: 1 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  formTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xxs },
  field: { gap: spacing.xxs },
  fieldLabel: { ...typography.captionMedium, color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputMultiline: { height: undefined, minHeight: 88, paddingVertical: spacing.xs },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.adminAccent, borderColor: colors.adminAccent },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnPrimary, fontWeight: '600' },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.xs },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    ...shadow.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyTitle: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  audienceChip: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  audienceChipText: { ...typography.tiny, color: colors.primary, fontWeight: '700' },
  historyMessage: { ...typography.body, color: colors.textSecondary },
  historyTimestamp: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});

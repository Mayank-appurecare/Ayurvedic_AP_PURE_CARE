import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { radius, shadow, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';

const FAQS = [
  {
    question: 'How long does delivery usually take?',
    answer:
      'Standard delivery takes 4-6 business days. Express and Same Day options are available at checkout for faster delivery.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'Unopened products can be returned within 7 days of delivery. Please contact support to initiate a return.',
  },
  {
    question: 'Are your products lab tested?',
    answer:
      'Yes, all AP Pure Care products are lab tested and GMP certified for quality and safety.',
  },
  {
    question: 'How do I use Ayurvedic capsules or powders correctly?',
    answer:
      'Each product page includes a "How to Use" section with recommended dosage and timing. Always follow the instructions on the label.',
  },
  {
    question: 'Can I cancel my order after placing it?',
    answer:
      'Orders can be cancelled before they are shipped from the My Orders section. Once shipped, cancellation is not available.',
  },
  {
    question: 'Do you offer Cash on Delivery?',
    answer:
      'Yes, Cash on Delivery is available for most pin codes alongside UPI, cards, net banking and wallets.',
  },
  {
    question: 'How can I track my order?',
    answer: 'Go to My Orders and tap on any ongoing order to see its live tracking timeline.',
  },
];

const CONTACT_OPTIONS = [
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Chat with us', action: 'chat' as const },
  { icon: 'call-outline' as const, label: 'Call Support: 1800-XXX-XXXX', action: 'tel:1800999999' },
  {
    icon: 'mail-outline' as const,
    label: 'Email: support@appurecare.example',
    action: 'mailto:support@appurecare.example',
  },
];

export function HelpSupportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleContactPress = async (action: string) => {
    if (action === 'chat') return;
    try {
      await Linking.openURL(action);
    } catch {
      // Silently ignore in the demo environment if no handler is available.
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Help & Support" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.card}>
          {CONTACT_OPTIONS.map((option, index) => (
            <Pressable
              key={option.label}
              onPress={() => handleContactPress(option.action)}
              style={[styles.contactRow, index !== CONTACT_OPTIONS.length - 1 && styles.rowDivider]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={option.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.contactLabel}>{option.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, index) => {
            const expanded = expandedIndex === index;
            return (
              <Pressable
                key={faq.question}
                onPress={() => setExpandedIndex(expanded ? null : index)}
                style={[styles.faqRow, index !== FAQS.length - 1 && styles.rowDivider]}
                accessibilityRole="button"
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
                {expanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadow.sm,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    faqRow: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    faqQuestion: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    faqAnswer: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  });

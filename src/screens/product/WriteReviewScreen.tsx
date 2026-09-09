import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigation/types';
import { radius, spacing, typography } from '../../theme';
import { useTheme, AppColors } from '../../theme/ThemeContext';
import { ReviewRepository } from '../../repositories/ReviewRepository';
import { useAuth } from '../../context/AuthContext';

import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rte = RouteProp<RootStackParamList, 'WriteReview'>;

const MIN_TEXT_LENGTH = 10;
const MAX_PHOTOS = 3;

export function WriteReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rte>();
  const { productId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const textTooShort = text.trim().length > 0 && text.trim().length < MIN_TEXT_LENGTH;
  const canSubmit = rating > 0 && text.trim().length >= MIN_TEXT_LENGTH && !submitting;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to attach a photo to your review.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await ReviewRepository.addReview({
        productId,
        customerName: user?.name && !user.isGuest ? user.name : 'Guest User',
        rating,
        verifiedPurchase: true,
        title: title.trim() || undefined,
        text: text.trim(),
        images,
      });
      setSubmitted(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch {
      Alert.alert('Something went wrong', 'We could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <AppHeader title="Write a Review" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.successTitle}>Thank you for your review!</Text>
          <Text style={styles.successDescription}>
            Your feedback helps other customers make better choices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <AppHeader title="Write a Review" showBack onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Your Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
              >
                <Ionicons
                  name={rating >= value ? 'star' : 'star-outline'}
                  size={36}
                  color={rating >= value ? colors.star : colors.starEmpty}
                  style={styles.starIcon}
                />
              </Pressable>
            ))}
          </View>
          {touched && rating === 0 && <Text style={styles.errorText}>Please select a rating.</Text>}

          <Text style={styles.label}>Review Title (optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Summarize your experience"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={80}
          />

          <Text style={styles.label}>Your Review</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What did you like or dislike? How did this product work for you?"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {touched && text.trim().length === 0 && (
            <Text style={styles.errorText}>Please write a review.</Text>
          )}
          {textTooShort && (
            <Text style={styles.errorText}>
              {MIN_TEXT_LENGTH - text.trim().length} more character
              {MIN_TEXT_LENGTH - text.trim().length === 1 ? '' : 's'} needed (minimum{' '}
              {MIN_TEXT_LENGTH}).
            </Text>
          )}

          <Text style={styles.label}>Add Photos (optional)</Text>
          <View style={styles.photoRow}>
            {images.map((uri, index) => (
              <View key={uri} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  onPress={() => removeImage(index)}
                  style={styles.photoRemoveBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                >
                  <Ionicons name="close" size={14} color={colors.textOnPrimary} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_PHOTOS && (
              <Pressable
                style={styles.photoPlaceholder}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Text style={styles.photoNote}>
            Add up to {MAX_PHOTOS} photos to help other customers.
          </Text>

          <PrimaryButton
            label="Submit Review"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxxl },
    label: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    starsRow: { flexDirection: 'row', gap: spacing.xs },
    starIcon: { marginRight: 2 },
    errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.textPrimary,
    },
    textArea: { minHeight: 120 },
    photoRow: { flexDirection: 'row', gap: spacing.sm },
    photoPlaceholder: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    photoNote: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs },
    photoThumbWrap: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden' },
    photoThumb: { width: '100%', height: '100%' },
    photoRemoveBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtn: { marginTop: spacing.xl },
    successWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    successIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    successTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    successDescription: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  });

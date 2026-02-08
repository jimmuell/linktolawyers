import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string | null) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReviewModal({ visible, onClose, onSubmit, isSubmitting }: ReviewModalProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) return;
    await onSubmit(rating, comment.trim() || null);
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Pressable onPress={handleClose} hitSlop={8}>
            <ThemedText style={{ color: colors.textLink }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Leave a Review</ThemedText>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          <ThemedText style={[styles.prompt, { color: colors.textSecondary }]}>
            How was your experience?
          </ThemedText>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={4}>
                <MaterialIcons
                  name={star <= rating ? 'star' : 'star-border'}
                  size={44}
                  color={star <= rating ? colors.warning : colors.textTertiary}
                />
              </Pressable>
            ))}
          </View>

          {rating > 0 && (
            <ThemedText style={[styles.ratingLabel, { color: colors.text }]}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </ThemedText>
          )}

          <TextInput
            style={[
              styles.commentInput,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
                color: colors.text,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: rating > 0 ? colors.primary : colors.surface },
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <ThemedText
                style={[
                  styles.submitText,
                  { color: rating > 0 ? colors.primaryForeground : colors.textTertiary },
                ]}>
                Submit Review
              </ThemedText>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.xl,
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
  },
  prompt: {
    fontSize: 16,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
    width: '100%',
  },
  submitButton: {
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

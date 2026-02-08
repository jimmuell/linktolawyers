import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFormContext } from 'react-hook-form';
import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { US_STATE_MAP } from '@/constants/us-states';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestCreateFormData } from '@/lib/validators';

import type { LocalAttachment } from './step-attachments';

interface StepReviewProps {
  attachments: LocalAttachment[];
}

export function StepReview({ attachments }: StepReviewProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { getValues } = useFormContext<RequestCreateFormData>();
  const values = getValues();

  const location = [values.city, values.state ? US_STATE_MAP[values.state] || values.state : null]
    .filter(Boolean)
    .join(', ');

  const budgetDisplay =
    values.budgetMin != null && values.budgetMax != null
      ? `$${values.budgetMin.toLocaleString()} – $${values.budgetMax.toLocaleString()}`
      : values.budgetMin != null
        ? `From $${values.budgetMin.toLocaleString()}`
        : values.budgetMax != null
          ? `Up to $${values.budgetMax.toLocaleString()}`
          : 'Not specified';

  const urgencyLabels: Record<string, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

  return (
    <View style={styles.content}>
      <ThemedText style={styles.heading}>Review Your Request</ThemedText>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ReviewRow label="Practice Area" value={PRACTICE_AREA_MAP[values.practiceArea] || values.practiceArea} />
        <ReviewRow label="Title" value={values.title} />
        <ReviewRow label="Description" value={values.description} multiline />
        <ReviewRow label="Location" value={location || 'Not specified'} />
        <ReviewRow label="Budget" value={budgetDisplay} />
        <ReviewRow label="Urgency" value={urgencyLabels[values.urgency] ?? values.urgency} isLast />
      </View>

      {attachments.length > 0 && (
        <View style={styles.attachmentSection}>
          <ThemedText style={styles.attachLabel}>
            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
          </ThemedText>
          <View style={styles.attachGrid}>
            {attachments.map((att) => {
              const isPdf = att.fileType === 'application/pdf' || att.fileType.endsWith('.pdf');
              return isPdf ? (
                <View key={att.uri} style={[styles.pdfThumb, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={colors.error} />
                  <ThemedText style={[styles.pdfThumbName, { color: colors.text }]} numberOfLines={1}>
                    {att.fileName}
                  </ThemedText>
                </View>
              ) : (
                <Image key={att.uri} source={{ uri: att.uri }} style={styles.thumbnail} />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function ReviewRow({
  label,
  value,
  multiline,
  isLast,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  isLast?: boolean;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
      <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, multiline && styles.multilineValue]} numberOfLines={multiline ? undefined : 2}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 16,
  },
  multilineValue: {
    lineHeight: 22,
  },
  attachmentSection: {
    gap: Spacing.sm,
  },
  attachLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
  },
  pdfThumb: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pdfThumbName: {
    fontSize: 7,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

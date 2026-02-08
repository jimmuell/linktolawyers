import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { StepAttachments, type LocalAttachment } from '@/components/request-wizard/step-attachments';
import { StepBudget } from '@/components/request-wizard/step-budget';
import { StepDetails } from '@/components/request-wizard/step-details';
import { StepLocation } from '@/components/request-wizard/step-location';
import { StepPracticeArea } from '@/components/request-wizard/step-practice-area';
import { StepReview } from '@/components/request-wizard/step-review';
import { WizardProgress } from '@/components/request-wizard/wizard-progress';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreateRequest, useUploadAttachment } from '@/hooks/use-requests';
import {
  requestCreateSchema,
  type RequestCreateFormData,
} from '@/lib/validators';
import type { RequestStatus } from '@/types';

const TOTAL_STEPS = 6;

// Fields to validate per step
const STEP_FIELDS: (keyof RequestCreateFormData)[][] = [
  ['practiceArea'],
  ['title', 'description'],
  ['state', 'city'],
  ['budgetMin', 'budgetMax', 'urgency'],
  [], // attachments — no form validation
  [], // review — full validation on submit
];

export function CreateRequestWizard() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const form = useForm<RequestCreateFormData>({
    resolver: zodResolver(requestCreateSchema),
    defaultValues: __DEV__
      ? {
          practiceArea: 'immigration',
          title: 'H-1B Work Visa Application Assistance',
          description:
            'I need help filing an H-1B work visa petition. My employer is sponsoring me and we need an attorney to prepare and file the petition with USCIS. Looking for someone experienced with H-1B cases, especially in the tech industry.',
          state: 'CA',
          city: 'San Francisco',
          budgetMin: 2000,
          budgetMax: 5000,
          urgency: 'high' as const,
        }
      : {
          practiceArea: '',
          title: '',
          description: '',
          state: null,
          city: null,
          budgetMin: null,
          budgetMax: null,
          urgency: 'normal' as const,
        },
    mode: 'onTouched',
  });

  const createRequest = useCreateRequest();
  const uploadAttachment = useUploadAttachment();

  const validateCurrentStep = useCallback(async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length === 0) return true;
    return form.trigger(fields);
  }, [step, form]);

  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [validateCurrentStep]);

  const handleBack = useCallback(() => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }, [step, router]);

  const handleSubmit = useCallback(
    async (status: RequestStatus) => {
      const isValid = await form.trigger();
      if (!isValid) {
        Alert.alert('Incomplete Form', 'Please fill in all required fields.');
        return;
      }

      try {
        const values = form.getValues();
        const request = await createRequest.mutateAsync({
          title: values.title,
          description: values.description,
          practice_area: values.practiceArea,
          state: values.state,
          city: values.city,
          budget_min: values.budgetMin,
          budget_max: values.budgetMax,
          urgency: values.urgency,
          status,
        });

        // Upload attachments
        for (const att of attachments) {
          await uploadAttachment.mutateAsync({
            requestId: request.id,
            fileUri: att.uri,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
          });
        }

        router.back();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create request');
      }
    },
    [form, createRequest, uploadAttachment, attachments, router],
  );

  const isSubmitting = createRequest.isPending || uploadAttachment.isPending;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepPracticeArea />;
      case 1:
        return <StepDetails />;
      case 2:
        return <StepLocation />;
      case 3:
        return <StepBudget />;
      case 4:
        return (
          <StepAttachments
            attachments={attachments}
            onAdd={(att) => setAttachments((prev) => [...prev, att])}
            onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
          />
        );
      case 5:
        return <StepReview attachments={attachments} />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <MaterialIcons name={step === 0 ? 'close' : 'arrow-back'} size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>New Request</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}>
          {step === 0 ? (
            <View style={styles.stepContentFlex}>{renderStep()}</View>
          ) : (
            <ScrollView
              style={styles.stepContentScroll}
              contentContainerStyle={styles.stepContentInner}
              keyboardShouldPersistTaps="handled">
              {renderStep()}
            </ScrollView>
          )}

          <View style={styles.footer}>
            {step < TOTAL_STEPS - 1 ? (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleNext}
                disabled={isSubmitting}>
                <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                  Continue
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.submitRow}>
                <Pressable
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => handleSubmit('draft')}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <ThemedText style={styles.secondaryButtonText}>Save Draft</ThemedText>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={() => handleSubmit('pending')}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                      Submit Request
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
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
  body: {
    flex: 1,
  },
  stepContentFlex: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepContentScroll: {
    flex: 1,
  },
  stepContentInner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    height: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

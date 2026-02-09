import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRICING_TYPES, VALID_UNTIL_OPTIONS } from '@/constants/pricing-types';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreateQuote, useQuoteTemplates, useSaveTemplate, useUpdateQuote } from '@/hooks/use-quotes';
import { useRequest } from '@/hooks/use-requests';
import { sendRequestStatusNotification } from '@/lib/push-helpers';
import { quoteCreateSchema, type QuoteCreateFormData } from '@/lib/validators';
import { formatFee } from '@/components/ui/quote-card';
import type { PricingType, Quote, QuoteTemplate } from '@/types';

interface CreateQuoteFormProps {
  requestId: string;
  editQuote?: Quote;
}

export function CreateQuoteForm({ requestId, editQuote }: CreateQuoteFormProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const isEditing = !!editQuote;

  const { data: request } = useRequest(requestId);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const saveTemplate = useSaveTemplate();
  const { data: templates } = useQuoteTemplates();

  const getEditDaysRemaining = () => {
    if (!editQuote) return 30;
    const validUntil = new Date(editQuote.valid_until);
    const now = new Date();
    const diff = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 7);
  };

  const form = useForm<QuoteCreateFormData>({
    resolver: zodResolver(quoteCreateSchema),
    defaultValues: editQuote
      ? {
          pricingType: editQuote.pricing_type,
          feeAmount: editQuote.fee_amount,
          estimatedHours: editQuote.estimated_hours,
          scopeOfWork: editQuote.scope_of_work,
          estimatedTimeline: editQuote.estimated_timeline,
          terms: editQuote.terms,
          validUntilDays: getEditDaysRemaining(),
        }
      : __DEV__
        ? {
            pricingType: 'flat_fee',
            feeAmount: 3500,
            estimatedHours: null,
            scopeOfWork:
              'Full legal representation for the matter described, including document preparation, filing, correspondence with opposing counsel, and court appearances as needed.',
            estimatedTimeline: '4-6 weeks',
            terms: 'Payment due upon engagement. 50% upfront, 50% upon completion.',
            validUntilDays: 30,
          }
        : {
            pricingType: 'flat_fee' as const,
            feeAmount: 0,
            estimatedHours: null,
            scopeOfWork: '',
            estimatedTimeline: null,
            terms: null,
            validUntilDays: 30,
          },
    mode: 'onTouched',
  });

  const pricingType = form.watch('pricingType');

  const loadTemplate = useCallback(
    (template: QuoteTemplate) => {
      form.setValue('pricingType', template.pricing_type);
      if (template.fee_amount) form.setValue('feeAmount', template.fee_amount);
      if (template.estimated_hours) form.setValue('estimatedHours', template.estimated_hours);
      if (template.scope_of_work) form.setValue('scopeOfWork', template.scope_of_work);
      if (template.estimated_timeline) form.setValue('estimatedTimeline', template.estimated_timeline);
      if (template.terms) form.setValue('terms', template.terms);
      setShowTemplates(false);
    },
    [form],
  );

  const handlePreview = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }
    setShowPreview(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const values = form.getValues();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + values.validUntilDays);

    try {
      if (isEditing) {
        await updateQuote.mutateAsync({
          id: editQuote.id,
          pricing_type: values.pricingType,
          fee_amount: values.feeAmount,
          estimated_hours: values.estimatedHours,
          scope_of_work: values.scopeOfWork,
          estimated_timeline: values.estimatedTimeline,
          terms: values.terms,
          valid_until: validUntil.toISOString(),
          status: 'submitted',
        });
      } else {
        await createQuote.mutateAsync({
          request_id: requestId,
          pricing_type: values.pricingType,
          fee_amount: values.feeAmount,
          estimated_hours: values.estimatedHours,
          scope_of_work: values.scopeOfWork,
          estimated_timeline: values.estimatedTimeline,
          terms: values.terms,
          valid_until: validUntil.toISOString(),
        });

        if (request) {
          sendRequestStatusNotification({
            recipientId: request.client_id,
            title: 'New Quote Received',
            body: `You received a new quote for "${request.title}"`,
            requestId,
            requestStatus: 'quoted',
            recipientRole: 'client',
          });
        }
      }

      if (saveAsTemplate && templateName.trim()) {
        await saveTemplate.mutateAsync({
          name: templateName.trim(),
          pricing_type: values.pricingType,
          fee_amount: values.feeAmount,
          estimated_hours: values.estimatedHours,
          scope_of_work: values.scopeOfWork,
          estimated_timeline: values.estimatedTimeline,
          terms: values.terms,
        });
      }

      setShowPreview(false);
      router.back();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : isEditing ? 'Failed to update quote' : 'Failed to submit quote';
      Alert.alert('Error', msg);
    }
  }, [form, requestId, request, createQuote, updateQuote, saveAsTemplate, templateName, saveTemplate, router, isEditing, editQuote]);

  const isSubmitting = createQuote.isPending || updateQuote.isPending;

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{isEditing ? 'Revise Quote' : 'Submit Quote'}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">

            {/* Request Summary */}
            {request && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Quoting for
                </ThemedText>
                <ThemedText style={styles.requestTitle} numberOfLines={2}>
                  {request.title}
                </ThemedText>
                <ThemedText style={[styles.requestMeta, { color: colors.textSecondary }]}>
                  {PRACTICE_AREA_MAP[request.practice_area] || request.practice_area}
                </ThemedText>
              </View>
            )}

            {/* Load Template */}
            {templates && templates.length > 0 && (
              <Pressable
                style={[styles.templateButton, { borderColor: colors.border }]}
                onPress={() => setShowTemplates(true)}>
                <MaterialIcons name="content-copy" size={18} color={colors.textLink} />
                <ThemedText style={[styles.templateButtonText, { color: colors.textLink }]}>
                  Load from Template
                </ThemedText>
              </Pressable>
            )}

            {/* Pricing Type */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Pricing Type *</ThemedText>
              <Controller
                control={form.control}
                name="pricingType"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <View style={styles.pricingTypeGrid}>
                      {PRICING_TYPES.map((pt) => {
                        const isSelected = value === pt.value;
                        return (
                          <Pressable
                            key={pt.value}
                            style={[
                              styles.pricingTypeCard,
                              {
                                borderColor: isSelected ? colors.primary : colors.border,
                                backgroundColor: isSelected ? colors.surface : colors.card,
                              },
                            ]}
                            onPress={() => onChange(pt.value)}>
                            <ThemedText style={[styles.pricingTypeLabel, isSelected && { color: colors.primary }]}>
                              {pt.label}
                            </ThemedText>
                            <ThemedText style={[styles.pricingTypeUnit, { color: colors.textSecondary }]}>
                              {pt.unit}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                    {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error.message}</ThemedText>}
                  </>
                )}
              />
            </View>

            {/* Fee Amount */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>
                {pricingType === 'contingency' ? 'Percentage *' : 'Fee Amount *'}
              </ThemedText>
              <Controller
                control={form.control}
                name="feeAmount"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <View style={[styles.inputRow, { borderColor: error ? colors.error : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                      <ThemedText style={[styles.inputPrefix, { color: colors.textSecondary }]}>
                        {pricingType === 'contingency' ? '%' : '$'}
                      </ThemedText>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={value ? String(value) : ''}
                        onChangeText={(text) => {
                          const num = parseFloat(text);
                          onChange(isNaN(num) ? 0 : num);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={colors.inputPlaceholder}
                      />
                    </View>
                    {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error.message}</ThemedText>}
                  </>
                )}
              />
            </View>

            {/* Estimated Hours (for hourly) */}
            {pricingType === 'hourly' && (
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>Estimated Hours *</ThemedText>
                <Controller
                  control={form.control}
                  name="estimatedHours"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            borderColor: error ? colors.error : colors.inputBorder,
                            backgroundColor: colors.inputBackground,
                            color: colors.text,
                          },
                        ]}
                        value={value != null ? String(value) : ''}
                        onChangeText={(text) => {
                          const num = parseFloat(text);
                          onChange(isNaN(num) ? null : num);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 20"
                        placeholderTextColor={colors.inputPlaceholder}
                      />
                      {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error.message}</ThemedText>}
                    </>
                  )}
                />
              </View>
            )}

            {/* Scope of Work */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Scope of Work *</ThemedText>
              <Controller
                control={form.control}
                name="scopeOfWork"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          borderColor: error ? colors.error : colors.inputBorder,
                          backgroundColor: colors.inputBackground,
                          color: colors.text,
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Describe the work you will perform..."
                      placeholderTextColor={colors.inputPlaceholder}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                    {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error.message}</ThemedText>}
                  </>
                )}
              />
            </View>

            {/* Estimated Timeline */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Estimated Timeline</ThemedText>
              <Controller
                control={form.control}
                name="estimatedTimeline"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      },
                    ]}
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text || null)}
                    onBlur={onBlur}
                    placeholder="e.g. 4-6 weeks"
                    placeholderTextColor={colors.inputPlaceholder}
                  />
                )}
              />
            </View>

            {/* Terms */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Terms & Conditions</ThemedText>
              <Controller
                control={form.control}
                name="terms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        borderColor: colors.inputBorder,
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      },
                    ]}
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text || null)}
                    onBlur={onBlur}
                    placeholder="Payment terms, conditions, disclaimers..."
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              />
            </View>

            {/* Valid Until */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Quote Valid For *</ThemedText>
              <Controller
                control={form.control}
                name="validUntilDays"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <View style={styles.chipRow}>
                      {VALID_UNTIL_OPTIONS.map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            style={[
                              styles.validChip,
                              {
                                borderColor: isSelected ? colors.primary : colors.border,
                                backgroundColor: isSelected ? colors.surface : colors.card,
                              },
                            ]}
                            onPress={() => onChange(opt.value)}>
                            <ThemedText
                              style={[styles.validChipText, isSelected && { color: colors.primary, fontWeight: '600' }]}>
                              {opt.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                    {error && <ThemedText style={[styles.errorText, { color: colors.error }]}>{error.message}</ThemedText>}
                  </>
                )}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handlePreview}
              disabled={isSubmitting}>
              <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Preview Quote
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Preview Modal */}
        <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.separator }]}>
              <Pressable onPress={() => setShowPreview(false)} hitSlop={8}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>Review Quote</ThemedText>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <PreviewContent form={form} request={request} colors={colors} />

              {/* Save as Template */}
              <Pressable
                style={styles.templateToggle}
                onPress={() => setSaveAsTemplate(!saveAsTemplate)}>
                <MaterialIcons
                  name={saveAsTemplate ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={saveAsTemplate ? colors.primary : colors.textTertiary}
                />
                <ThemedText style={{ color: colors.text }}>Save as template</ThemedText>
              </Pressable>
              {saveAsTemplate && (
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                    },
                  ]}
                  value={templateName}
                  onChangeText={setTemplateName}
                  placeholder="Template name"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              )}
            </ScrollView>
            <View style={styles.footer}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                    {isEditing ? 'Update Quote' : 'Submit Quote'}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Templates Modal */}
        <Modal visible={showTemplates} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.separator }]}>
              <ThemedText style={styles.headerTitle}>Templates</ThemedText>
              <Pressable onPress={() => setShowTemplates(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {templates?.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.templateItem, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => loadTemplate(t)}>
                  <ThemedText style={styles.templateItemName}>{t.name}</ThemedText>
                  <ThemedText style={[styles.templateItemMeta, { color: colors.textSecondary }]}>
                    {PRICING_TYPES.find((p) => p.value === t.pricing_type)?.label}
                    {t.fee_amount != null && ` - ${formatFee(t.pricing_type, t.fee_amount, t.estimated_hours)}`}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </FormProvider>
  );
}

function PreviewContent({
  form,
  request,
  colors,
}: {
  form: ReturnType<typeof useForm<QuoteCreateFormData>>;
  request: ReturnType<typeof useRequest>['data'];
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const values = form.getValues();
  const pricingLabel = PRICING_TYPES.find((p) => p.value === values.pricingType)?.label ?? '';
  const feeDisplay = formatFee(values.pricingType as PricingType, values.feeAmount, values.estimatedHours);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + values.validUntilDays);

  return (
    <View style={previewStyles.container}>
      {request && (
        <View style={[previewStyles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Request</ThemedText>
          <ThemedText style={previewStyles.requestTitle}>{request.title}</ThemedText>
        </View>
      )}

      <View style={previewStyles.section}>
        <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Pricing</ThemedText>
        <ThemedText style={previewStyles.value}>{pricingLabel}</ThemedText>
        <ThemedText style={previewStyles.feeAmount}>{feeDisplay}</ThemedText>
      </View>

      <View style={previewStyles.section}>
        <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Scope of Work</ThemedText>
        <ThemedText style={previewStyles.text}>{values.scopeOfWork}</ThemedText>
      </View>

      {values.estimatedTimeline && (
        <View style={previewStyles.section}>
          <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Timeline</ThemedText>
          <ThemedText style={previewStyles.value}>{values.estimatedTimeline}</ThemedText>
        </View>
      )}

      {values.terms && (
        <View style={previewStyles.section}>
          <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Terms</ThemedText>
          <ThemedText style={previewStyles.text}>{values.terms}</ThemedText>
        </View>
      )}

      <View style={previewStyles.section}>
        <ThemedText style={[previewStyles.label, { color: colors.textSecondary }]}>Valid Until</ThemedText>
        <ThemedText style={previewStyles.value}>
          {validUntil.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' '}({values.validUntilDays} days)
        </ThemedText>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    gap: Spacing.xl,
  },
  requestCard: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: Spacing.xs,
  },
});

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestMeta: {
    fontSize: 13,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricingTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pricingTypeCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  pricingTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricingTypeUnit: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.md,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 48,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    height: 48,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  validChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  validChipText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
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
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  templateItem: {
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateItemMeta: {
    fontSize: 13,
  },
});

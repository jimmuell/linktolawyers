import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { formatFee } from '@/components/ui/quote-card';
import { PRICING_TYPES } from '@/constants/pricing-types';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeleteTemplate, useQuoteTemplates, useSaveTemplate, useUpdateTemplate } from '@/hooks/use-quotes';
import type { QuoteTemplate } from '@/types';

export function ManageTemplatesScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const { data: templates, isLoading, refetch, isRefetching } = useQuoteTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = useCallback(
    (template: QuoteTemplate) => {
      Alert.alert('Delete Template', `Delete "${template.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate.mutate(template.id),
        },
      ]);
    },
    [deleteTemplate],
  );

  const handleEdit = useCallback((template: QuoteTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setShowModal(true);
  }, []);

  const renderItem = ({ item }: { item: QuoteTemplate }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardName}>{item.name}</ThemedText>
        <View style={styles.cardActions}>
          <Pressable onPress={() => handleEdit(item)} hitSlop={8}>
            <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>
      <ThemedText style={[styles.cardMeta, { color: colors.textSecondary }]}>
        {PRICING_TYPES.find((p) => p.value === item.pricing_type)?.label}
        {item.fee_amount != null && ` - ${formatFee(item.pricing_type, item.fee_amount, item.estimated_hours)}`}
      </ThemedText>
      {item.scope_of_work && (
        <ThemedText style={[styles.cardScope, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.scope_of_work}
        </ThemedText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Quote Templates</ThemedText>
        <Pressable onPress={handleCreate} hitSlop={8}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading && !templates ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={templates?.length ? styles.list : styles.emptyList}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="content-copy"
              title="No templates yet"
              description="Create templates to quickly fill in quote forms."
              actionLabel="Create Template"
              onAction={handleCreate}
            />
          }
        />
      )}

      <TemplateFormModal
        visible={showModal}
        template={editingTemplate}
        onClose={() => {
          setShowModal(false);
          setEditingTemplate(null);
        }}
      />
    </SafeAreaView>
  );
}

interface TemplateFormData {
  name: string;
  pricingType: string;
  feeAmount: string;
  estimatedHours: string;
  scopeOfWork: string;
  estimatedTimeline: string;
  terms: string;
}

function TemplateFormModal({
  visible,
  template,
  onClose,
}: {
  visible: boolean;
  template: QuoteTemplate | null;
  onClose: () => void;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const saveTemplate = useSaveTemplate();
  const updateTemplate = useUpdateTemplate();
  const isEditing = !!template;

  const form = useForm<TemplateFormData>({
    defaultValues: template
      ? {
          name: template.name,
          pricingType: template.pricing_type,
          feeAmount: template.fee_amount?.toString() ?? '',
          estimatedHours: template.estimated_hours?.toString() ?? '',
          scopeOfWork: template.scope_of_work ?? '',
          estimatedTimeline: template.estimated_timeline ?? '',
          terms: template.terms ?? '',
        }
      : {
          name: '',
          pricingType: 'flat_fee',
          feeAmount: '',
          estimatedHours: '',
          scopeOfWork: '',
          estimatedTimeline: '',
          terms: '',
        },
  });

  // Reset form when template changes
  useState(() => {
    if (visible) {
      form.reset(
        template
          ? {
              name: template.name,
              pricingType: template.pricing_type,
              feeAmount: template.fee_amount?.toString() ?? '',
              estimatedHours: template.estimated_hours?.toString() ?? '',
              scopeOfWork: template.scope_of_work ?? '',
              estimatedTimeline: template.estimated_timeline ?? '',
              terms: template.terms ?? '',
            }
          : {
              name: '',
              pricingType: 'flat_fee',
              feeAmount: '',
              estimatedHours: '',
              scopeOfWork: '',
              estimatedTimeline: '',
              terms: '',
            },
      );
    }
  });

  const handleSave = useCallback(async () => {
    const values = form.getValues();
    if (!values.name.trim()) {
      Alert.alert('Required', 'Please enter a template name.');
      return;
    }

    const payload = {
      name: values.name.trim(),
      pricing_type: values.pricingType as QuoteTemplate['pricing_type'],
      fee_amount: values.feeAmount ? parseFloat(values.feeAmount) : null,
      estimated_hours: values.estimatedHours ? parseFloat(values.estimatedHours) : null,
      scope_of_work: values.scopeOfWork || null,
      estimated_timeline: values.estimatedTimeline || null,
      terms: values.terms || null,
    };

    try {
      if (isEditing) {
        await updateTemplate.mutateAsync({ id: template.id, ...payload });
      } else {
        await saveTemplate.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save template');
    }
  }, [form, isEditing, template, updateTemplate, saveTemplate, onClose]);

  const isSubmitting = saveTemplate.isPending || updateTemplate.isPending;
  const pricingType = form.watch('pricingType');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEditing ? 'Edit Template' : 'New Template'}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Template Name *</ThemedText>
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Standard Immigration Case"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Pricing Type</ThemedText>
            <Controller
              control={form.control}
              name="pricingType"
              render={({ field: { onChange, value } }) => (
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
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>
              {pricingType === 'contingency' ? 'Percentage' : 'Fee Amount'}
            </ThemedText>
            <Controller
              control={form.control}
              name="feeAmount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              )}
            />
          </View>

          {pricingType === 'hourly' && (
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Estimated Hours</ThemedText>
              <Controller
                control={form.control}
                name="estimatedHours"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.textInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 20"
                    placeholderTextColor={colors.inputPlaceholder}
                  />
                )}
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Scope of Work</ThemedText>
            <Controller
              control={form.control}
              name="scopeOfWork"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textArea, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Describe the work..."
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Estimated Timeline</ThemedText>
            <Controller
              control={form.control}
              name="estimatedTimeline"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. 4-6 weeks"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Terms & Conditions</ThemedText>
            <Controller
              control={form.control}
              name="terms"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textArea, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Payment terms, conditions..."
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {isEditing ? 'Update Template' : 'Create Template'}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardMeta: {
    fontSize: 13,
  },
  cardScope: {
    fontSize: 13,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  pricingTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
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
});

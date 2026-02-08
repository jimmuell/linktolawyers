import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRACTICE_AREAS } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { US_STATES } from '@/constants/us-states';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BrowseFilters } from '@/hooks/use-requests';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' as const },
  { label: 'Oldest', value: 'oldest' as const },
  { label: 'Budget: High → Low', value: 'budget_high' as const },
  { label: 'Budget: Low → High', value: 'budget_low' as const },
];

interface FilterBarProps {
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [activeModal, setActiveModal] = useState<'practiceArea' | 'state' | 'sort' | null>(null);

  const practiceAreaLabel = filters.practiceArea
    ? PRACTICE_AREAS.find((pa) => pa.value === filters.practiceArea)?.label ?? 'Area'
    : 'Practice Area';

  const stateLabel = filters.state
    ? US_STATES.find((s) => s.value === filters.state)?.label ?? 'State'
    : 'Location';

  const sortLabel = filters.sort
    ? SORT_OPTIONS.find((s) => s.value === filters.sort)?.label ?? 'Sort'
    : 'Newest';

  const renderChip = (label: string, isActive: boolean, onPress: () => void, onClear?: () => void) => (
    <Pressable
      style={[
        styles.chip,
        { borderColor: isActive ? colors.primary : colors.border },
        isActive && { backgroundColor: colors.surface },
      ]}
      onPress={onPress}>
      <ThemedText
        style={[styles.chipText, { color: isActive ? colors.primary : colors.text }]}>
        {label}
      </ThemedText>
      {isActive && onClear ? (
        <Pressable onPress={onClear} hitSlop={4}>
          <MaterialIcons name="close" size={14} color={colors.primary} />
        </Pressable>
      ) : (
        <MaterialIcons name="expand-more" size={16} color={isActive ? colors.primary : colors.textTertiary} />
      )}
    </Pressable>
  );

  const renderPickerModal = (
    type: 'practiceArea' | 'state' | 'sort',
    title: string,
    options: { label: string; value: string }[],
    selectedValue: string | undefined,
    onSelect: (value: string) => void,
  ) => (
    <Modal visible={activeModal === type} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
          <ThemedText style={styles.modalTitle}>{title}</ThemedText>
          <Pressable onPress={() => setActiveModal(null)}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = selectedValue === item.value;
            return (
              <Pressable
                style={[styles.modalItem, { borderBottomColor: colors.separator }]}
                onPress={() => {
                  onSelect(item.value);
                  setActiveModal(null);
                }}>
                <ThemedText style={isSelected ? styles.modalItemSelected : undefined}>
                  {item.label}
                </ThemedText>
                {isSelected && <MaterialIcons name="check" size={20} color={colors.primary} />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.container}>
        {renderChip(
          practiceAreaLabel,
          !!filters.practiceArea,
          () => setActiveModal('practiceArea'),
          filters.practiceArea ? () => onChange({ ...filters, practiceArea: undefined }) : undefined,
        )}
        {renderChip(
          stateLabel,
          !!filters.state,
          () => setActiveModal('state'),
          filters.state ? () => onChange({ ...filters, state: undefined }) : undefined,
        )}
        {renderChip(
          sortLabel,
          !!filters.sort && filters.sort !== 'newest',
          () => setActiveModal('sort'),
        )}
      </ScrollView>

      {renderPickerModal(
        'practiceArea',
        'Practice Area',
        PRACTICE_AREAS,
        filters.practiceArea,
        (value) => onChange({ ...filters, practiceArea: value }),
      )}
      {renderPickerModal(
        'state',
        'Location',
        US_STATES,
        filters.state,
        (value) => onChange({ ...filters, state: value }),
      )}
      {renderPickerModal(
        'sort',
        'Sort By',
        SORT_OPTIONS,
        filters.sort,
        (value) => onChange({ ...filters, sort: value as BrowseFilters['sort'] }),
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemSelected: {
    fontWeight: '600',
  },
});

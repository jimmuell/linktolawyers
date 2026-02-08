import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRACTICE_AREAS } from '@/constants/practice-areas';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PracticeAreaPickerProps {
  value: string;
  onSelect: (value: string) => void;
}

export function PracticeAreaPicker({ value, onSelect }: PracticeAreaPickerProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [search, setSearch] = useState('');

  const filtered = search
    ? PRACTICE_AREAS.filter((pa) => pa.label.toLowerCase().includes(search.toLowerCase()))
    : PRACTICE_AREAS;

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <MaterialIcons name="search" size={20} color={colors.inputPlaceholder} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search practice areas..."
          placeholderTextColor={colors.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => {
          const isSelected = value === item.value;
          return (
            <Pressable
              style={[
                styles.item,
                { borderColor: colors.separator },
                isSelected && { backgroundColor: colors.surface },
              ]}
              onPress={() => onSelect(item.value)}>
              <ThemedText style={[styles.itemText, isSelected && { fontWeight: '600' }]}>
                {item.label}
              </ThemedText>
              {isSelected && (
                <MaterialIcons name="check" size={20} color={colors.primary} />
              )}
            </Pressable>
          );
        }}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
  },
});

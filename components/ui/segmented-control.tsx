import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  badgeCount?: number;
  badgeSegmentIndex?: number;
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelect,
  badgeCount,
  badgeSegmentIndex = 1,
}: SegmentedControlProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {segments.map((label, index) => {
        const isSelected = index === selectedIndex;
        const showBadge = index === badgeSegmentIndex && (badgeCount ?? 0) > 0;

        return (
          <Pressable
            key={label}
            style={[
              styles.segment,
              isSelected && [styles.selectedSegment, { backgroundColor: colors.primary }],
            ]}
            onPress={() => onSelect(index)}>
            <ThemedText
              style={[
                styles.label,
                { color: isSelected ? colors.primaryForeground : colors.textSecondary },
              ]}>
              {label}
            </ThemedText>
            {showBadge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isSelected ? colors.primaryForeground : colors.error },
                ]}>
                <ThemedText
                  style={[
                    styles.badgeText,
                    { color: isSelected ? colors.primary : '#FFFFFF' },
                  ]}>
                  {badgeCount! > 99 ? '99+' : badgeCount}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    padding: 2,
    marginHorizontal: Spacing.lg,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md - 1,
    gap: Spacing.xs,
  },
  selectedSegment: {
    // backgroundColor set inline
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

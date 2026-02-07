import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

const roles = [
  { value: 'client' as const, label: 'Client', icon: 'person' as const },
  { value: 'attorney' as const, label: 'Attorney', icon: 'gavel' as const },
];

interface RoleSelectorProps {
  value: string | undefined;
  onValueChange: (value: 'client' | 'attorney') => void;
  error?: string;
}

export function RoleSelector({ value, onValueChange, error }: RoleSelectorProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  return (
    <View style={styles.container}>
      <Text style={[Typography.labelMedium, styles.label, { color: textSecondary }]}>Role</Text>
      <View style={[styles.segmentContainer, { borderColor: error ? errorColor : border }]}>
        {roles.map((role) => {
          const isSelected = value === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => onValueChange(role.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.segment,
                isSelected && { backgroundColor: primary },
                !isSelected && { backgroundColor: surface },
              ]}
            >
              <MaterialIcons
                name={role.icon}
                size={20}
                color={isSelected ? primaryForeground : textColor}
              />
              <Text
                style={[
                  Typography.labelLarge,
                  { color: isSelected ? primaryForeground : textColor },
                ]}
              >
                {role.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error != null && (
        <Text style={[Typography.caption, styles.errorText, { color: errorColor }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xxs,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  errorText: {
    marginTop: Spacing.xxs,
  },
});

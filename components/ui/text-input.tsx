import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  View,
} from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextInput({
  label,
  error,
  helperText,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const inputBg = useThemeColor({}, 'inputBackground');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const borderFocused = useThemeColor({}, 'borderFocused');
  const placeholderColor = useThemeColor({}, 'inputPlaceholder');
  const errorColor = useThemeColor({}, 'error');

  const borderColor = error ? errorColor : isFocused ? borderFocused : inputBorder;

  return (
    <View style={styles.container}>
      {label != null && (
        <Text style={[Typography.labelMedium, styles.label, { color: textSecondary }]}>
          {label}
        </Text>
      )}
      <RNTextInput
        placeholderTextColor={placeholderColor}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          Typography.bodyLarge,
          styles.input,
          {
            color: textColor,
            backgroundColor: inputBg,
            borderColor,
          },
          style,
        ]}
        {...rest}
      />
      {error != null && (
        <Text style={[Typography.caption, styles.helperText, { color: errorColor }]}>{error}</Text>
      )}
      {error == null && helperText != null && (
        <Text style={[Typography.caption, styles.helperText, { color: textSecondary }]}>
          {helperText}
        </Text>
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
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  helperText: {
    marginTop: Spacing.xxs,
  },
});

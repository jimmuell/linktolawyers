import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestStatus } from '@/types';

const TIMELINE_STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'pending', label: 'Pending' },
  { status: 'quoted', label: 'Quoted' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'closed', label: 'Closed' },
];

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  pending: 1,
  quoted: 2,
  accepted: 3,
  closed: 4,
};

type StepState = 'completed' | 'current' | 'upcoming';

function getStepState(stepIndex: number, currentIndex: number): StepState {
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

interface StatusTimelineProps {
  status: RequestStatus;
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isCancelled = status === 'cancelled';
  const currentIndex = STATUS_ORDER[status] ?? -1;

  const steps = isCancelled
    ? [...TIMELINE_STEPS, { status: 'cancelled' as RequestStatus, label: 'Cancelled' }]
    : TIMELINE_STEPS;

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        let state: StepState | 'cancelled';
        if (isCancelled) {
          if (index < steps.length - 1) {
            state = 'upcoming'; // dim all regular steps
          } else {
            state = 'cancelled'; // the cancelled step itself
          }
        } else {
          state = getStepState(index, currentIndex);
        }

        const isLast = index === steps.length - 1;

        // Determine if the connector line to the next step should be "filled"
        const nextState = !isLast && !isCancelled ? getStepState(index + 1, currentIndex) : 'upcoming';
        const lineFilled = state === 'completed' && nextState !== 'upcoming';

        let circleColor: string;
        let textColor: string;
        let iconName: keyof typeof MaterialIcons.glyphMap | null = null;

        switch (state) {
          case 'completed':
            circleColor = colors.success;
            textColor = colors.textSecondary;
            iconName = 'check';
            break;
          case 'current':
            circleColor = colors.primary;
            textColor = colors.text;
            break;
          case 'cancelled':
            circleColor = colors.error;
            textColor = colors.error;
            iconName = 'close';
            break;
          default:
            circleColor = colors.border;
            textColor = colors.textTertiary;
        }

        const lineColor = lineFilled ? colors.success : colors.border;

        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.indicatorRow}>
              {/* Left connector */}
              {index > 0 && <View style={[styles.lineSegment, { backgroundColor: index <= currentIndex && !isCancelled ? colors.success : colors.border }]} />}
              {index === 0 && <View style={styles.lineSegment} />}

              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: state === 'completed' || state === 'cancelled' ? circleColor : 'transparent',
                    borderColor: circleColor,
                  },
                ]}>
                {iconName ? (
                  <MaterialIcons name={iconName} size={12} color="#FFFFFF" />
                ) : state === 'current' ? (
                  <View style={[styles.dot, { backgroundColor: circleColor }]} />
                ) : null}
              </View>

              {/* Right connector */}
              {!isLast && <View style={[styles.lineSegment, { backgroundColor: lineColor }]} />}
              {isLast && <View style={styles.lineSegment} />}
            </View>

            <ThemedText
              style={[
                styles.label,
                { color: textColor },
                (state === 'current' || state === 'cancelled') && styles.labelCurrent,
              ]}>
              {step.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  lineSegment: {
    flex: 1,
    height: 2,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  labelCurrent: {
    fontWeight: '600',
  },
});

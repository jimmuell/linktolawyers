import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ProfileButton } from '@/components/ui/profile-button';
import { Colors } from '@/constants/theme';
import { Radii, Spacing, Typography } from '@/constants/typography';
import { useCases } from '@/hooks/use-cases';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAttorneyQuotes } from '@/hooks/use-quotes';
import { useAuthStore } from '@/stores/auth-store';

export default function AttorneyHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const { data: allQuotes } = useAttorneyQuotes();
  const { data: activeCases } = useCases('attorney', 'accepted');

  const firstName = profile?.full_name?.split(' ')[0];

  const activeQuoteCount = allQuotes?.filter(
    (q) => q.status === 'submitted' || q.status === 'viewed',
  ).length ?? 0;
  const activeCaseCount = activeCases?.length ?? 0;

  const stats = [
    { label: 'Active Quotes', value: activeQuoteCount },
    { label: 'Active Cases', value: activeCaseCount },
    { label: 'Unread Messages', value: 0 },
    { label: 'Consultations', value: 0 },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(Constants.statusBarHeight, 50) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <ProfileButton />
        </View>

        {/* Welcome Header */}
        <View style={styles.welcomeSection}>
          <Text style={[Typography.bodyLarge, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[Typography.headlineLarge, { color: colors.text }]}>
            {firstName ?? 'there'}
          </Text>
        </View>

        {/* CTA Card */}
        <View style={[styles.ctaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ctaRow}>
            <View style={[styles.ctaIconWrap, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="search" size={24} color={colors.primaryForeground} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={[Typography.titleMedium, { color: colors.text }]}>Find New Clients</Text>
              <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                Browse requests matching your practice areas
              </Text>
            </View>
          </View>
          <Button
            title="Browse Requests"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(attorney)/(tabs)/browse')}
          />
        </View>

        {/* Dashboard */}
        <Text style={[Typography.titleLarge, styles.sectionTitle, { color: colors.text }]}>
          Dashboard
        </Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[Typography.titleLarge, styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.emptyActivity}>
            <MaterialIcons name="schedule" size={36} color={colors.textTertiary} />
            <Text style={[Typography.titleSmall, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              No recent activity
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.textTertiary, textAlign: 'center' }]}>
              Browse requests to start connecting with clients
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeSection: {
    marginBottom: Spacing['2xl'],
  },
  ctaCard: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ctaTextWrap: {
    flex: 1,
    gap: Spacing.xxs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  activityCard: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xxs,
  },
});

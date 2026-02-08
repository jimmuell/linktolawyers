import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileButton } from '@/components/ui/profile-button';
import { Colors } from '@/constants/theme';
import { Radii, Spacing, Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useClientRequests } from '@/hooks/use-requests';
import { useAuthStore } from '@/stores/auth-store';
import type { Request } from '@/types';

const QUICK_ACTIONS = [
  { label: 'My Requests', icon: 'description' as const, route: '/(client)/(tabs)/requests' },
  { label: 'Messages', icon: 'forum' as const, route: '/(client)/(tabs)/messages' },
  { label: 'My Cases', icon: 'work' as const, route: '/(client)/(tabs)/cases' },
  { label: 'Find Attorney', icon: 'search' as const, route: '/(client)/requests/new' },
] as const;

function getStatusColor(status: Request['status'], colors: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  switch (status) {
    case 'draft':
      return colors.textSecondary;
    case 'pending':
      return colors.warning;
    case 'quoted':
      return colors.info;
    case 'accepted':
      return colors.success;
    case 'closed':
      return colors.textTertiary;
    case 'cancelled':
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

export default function ClientHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: recentRequests } = useClientRequests();

  const firstName = profile?.full_name?.split(' ')[0];

  const handleCreateRequest = useCallback(() => {
    router.push('/(client)/requests/new');
  }, [router]);

  const handleRequestPress = useCallback(
    (request: Request) => {
      router.push(`/(client)/requests/${request.id}`);
    },
    [router],
  );

  const recent = recentRequests?.slice(0, 3);

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
              <MaterialIcons name="add" size={24} color={colors.primaryForeground} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={[Typography.titleMedium, { color: colors.text }]}>Need Legal Help?</Text>
              <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>
                Create a request and receive quotes from attorneys
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleCreateRequest}>
            <Text style={[Typography.labelLarge, { color: colors.primaryForeground }]}>
              Create Request
            </Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <Text style={[Typography.titleLarge, styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.quickCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(action.route as never)}>
              <MaterialIcons name={action.icon} size={28} color={colors.primary} />
              <Text style={[Typography.labelLarge, { color: colors.text, marginTop: Spacing.sm }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[Typography.titleLarge, styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!recent?.length ? (
            <View style={styles.emptyActivity}>
              <MaterialIcons name="schedule" size={36} color={colors.textTertiary} />
              <Text style={[Typography.titleSmall, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                No recent activity
              </Text>
              <Text style={[Typography.bodySmall, { color: colors.textTertiary }]}>
                Create a request to get started
              </Text>
            </View>
          ) : (
            recent.map((req, idx) => (
              <Pressable
                key={req.id}
                style={({ pressed }) => [
                  styles.activityRow,
                  idx < recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleRequestPress(req)}>
                <View style={styles.activityInfo}>
                  <Text style={[Typography.titleSmall, { color: colors.text }]} numberOfLines={1}>
                    {req.title}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {req.practice_area} · {new Date(req.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status, colors) + '1A' }]}>
                  <Text style={[Typography.labelSmall, { color: getStatusColor(req.status, colors) }]}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
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
  ctaButton: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  quickCard: {
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
  activityCard: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.xxs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  activityInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: Spacing.xxs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
  },
});

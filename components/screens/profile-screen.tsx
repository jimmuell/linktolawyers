import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Radii, Spacing, Typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/stores/auth-store';

const AVATAR_SIZE = 100;

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  textColor: string;
  iconColor: string;
  borderColor: string;
  isLast?: boolean;
}

function MenuItem({ icon, label, onPress, textColor, iconColor, borderColor, isLast }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.menuItemLeft}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
        <Text style={[Typography.bodyLarge, { color: textColor, marginLeft: Spacing.md }]}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={iconColor} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const profile = useAuthStore((s) => s.profile);
  const attorneyProfile = useAuthStore((s) => s.attorneyProfile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const isAttorney = profile?.role === 'attorney';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={26} color={textColor} />
          </Pressable>
          <Text style={[Typography.headlineLarge, { color: textColor }]}>Profile</Text>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <MaterialIcons name="settings" size={26} color={textColor} />
          </Pressable>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: surface }]}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <MaterialIcons name="person" size={AVATAR_SIZE * 0.5} color={textSecondary} />
            )}
          </View>

          {/* Name & Email */}
          <Text style={[Typography.headlineMedium, { color: textColor, marginTop: Spacing.lg }]}>
            {profile?.full_name ?? 'No name set'}
          </Text>
          <Text style={[Typography.bodyMedium, { color: textSecondary, marginTop: Spacing.xs }]}>
            {user?.email ?? ''}
          </Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.badgeText}>
                {isAttorney ? 'Attorney' : 'Client'}
              </Text>
            </View>
            {isAttorney && attorneyProfile?.is_verified && (
              <View style={[styles.badge, { backgroundColor: '#22C55E' }]}>
                <MaterialIcons name="verified" size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Attorney Details Card */}
        {isAttorney && attorneyProfile && (
          <View style={[styles.detailsCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[Typography.titleMedium, { color: textColor, marginBottom: Spacing.md }]}>
              Attorney Details
            </Text>
            <DetailRow label="Bar Number" value={attorneyProfile.bar_number || '—'} textColor={textColor} secondaryColor={textSecondary} borderColor={border} />
            <DetailRow label="State" value={attorneyProfile.bar_state || '—'} textColor={textColor} secondaryColor={textSecondary} borderColor={border} />
            <DetailRow
              label="Practice Areas"
              value={attorneyProfile.practice_areas?.length ? attorneyProfile.practice_areas.join(', ') : '—'}
              textColor={textColor}
              secondaryColor={textSecondary}
              borderColor={border}
            />
            <DetailRow
              label="Hourly Rate"
              value={attorneyProfile.hourly_rate ? `$${attorneyProfile.hourly_rate}/hr` : '—'}
              textColor={textColor}
              secondaryColor={textSecondary}
              borderColor={border}
              isLast
            />
          </View>
        )}

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: surface, borderColor: border }]}>
          {isAttorney && (
            <MenuItem
              icon="work"
              label="Edit Attorney Profile"
              onPress={() => router.push('/edit-attorney-profile')}
              textColor={textColor}
              iconColor={textSecondary}
              borderColor={border}
            />
          )}
          <MenuItem
            icon="person-outline"
            label="Edit Basic Info"
            onPress={() => router.push('/edit-basic-info')}
            textColor={textColor}
            iconColor={textSecondary}
            borderColor={border}
          />
          <MenuItem
            icon="event-available"
            label="Availability"
            onPress={() => router.push('/availability')}
            textColor={textColor}
            iconColor={textSecondary}
            borderColor={border}
          />
          <MenuItem
            icon="notifications-none"
            label="Notifications"
            onPress={() => router.push('/notifications')}
            textColor={textColor}
            iconColor={textSecondary}
            borderColor={border}
            isLast
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button title="Sign Out" variant="outline" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  textColor: string;
  secondaryColor: string;
  borderColor: string;
  isLast?: boolean;
}

function DetailRow({ label, value, textColor, secondaryColor, borderColor, isLast }: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <Text style={[Typography.bodyMedium, { color: secondaryColor }]}>{label}</Text>
      <Text style={[Typography.bodyMedium, { color: textColor, flex: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  menuCard: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutSection: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
  },
});

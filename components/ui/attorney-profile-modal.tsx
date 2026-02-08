import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRACTICE_AREA_MAP } from '@/constants/practice-areas';
import { US_STATE_MAP } from '@/constants/us-states';
import { Colors } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { AttorneyProfile, Profile } from '@/types';

interface AttorneyProfileModalProps {
  visible: boolean;
  attorneyId: string;
  onClose: () => void;
}

export function AttorneyProfileModal({ visible, attorneyId, onClose }: AttorneyProfileModalProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attorneyProfile, setAttorneyProfile] = useState<AttorneyProfile | null>(null);

  useEffect(() => {
    if (!visible || !attorneyId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', attorneyId)
          .single() as unknown as { data: Profile | null };
        if (profileData) setProfile(profileData);

        const { data: attorneyData } = await supabase
          .from('attorney_profiles')
          .select('*')
          .eq('id', attorneyId)
          .maybeSingle() as unknown as { data: AttorneyProfile | null };
        if (attorneyData) setAttorneyProfile(attorneyData);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [visible, attorneyId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <View style={{ width: 24 }} />
          <ThemedText style={styles.headerTitle}>Attorney Profile</ThemedText>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !profile ? (
          <View style={styles.center}>
            <ThemedText style={{ color: colors.textSecondary }}>Profile not available.</ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileHeader}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={40} color={colors.textTertiary} />
                </View>
              )}
              <ThemedText style={styles.name}>{profile.full_name ?? 'Attorney'}</ThemedText>
              {profile.username && (
                <ThemedText style={[styles.username, { color: colors.textSecondary }]}>
                  @{profile.username}
                </ThemedText>
              )}
            </View>

            {attorneyProfile && (
              <>
                <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <DetailRow label="Bar Number" value={attorneyProfile.bar_number} />
                  <DetailRow
                    label="Bar State"
                    value={US_STATE_MAP[attorneyProfile.bar_state] ?? attorneyProfile.bar_state}
                  />
                  {attorneyProfile.years_of_experience != null && (
                    <DetailRow label="Experience" value={`${attorneyProfile.years_of_experience} years`} />
                  )}
                  {attorneyProfile.hourly_rate != null && (
                    <DetailRow label="Hourly Rate" value={`$${attorneyProfile.hourly_rate}/hr`} />
                  )}
                  {attorneyProfile.is_verified && (
                    <DetailRow label="Status" value="Verified" />
                  )}
                </View>

                {attorneyProfile.practice_areas.length > 0 && (
                  <View style={styles.practiceSection}>
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                      Practice Areas
                    </ThemedText>
                    <View style={styles.chipRow}>
                      {attorneyProfile.practice_areas.map((area) => (
                        <View key={area} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <ThemedText style={[styles.chipText, { color: colors.text }]}>
                            {PRACTICE_AREA_MAP[area] ?? area}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {attorneyProfile.bio && (
                  <View style={styles.bioSection}>
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>About</ThemedText>
                    <ThemedText style={styles.bioText}>{attorneyProfile.bio}</ThemedText>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.detailRow}>
      <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  username: {
    fontSize: 14,
  },
  section: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  practiceSection: {
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  bioSection: {
    gap: Spacing.sm,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

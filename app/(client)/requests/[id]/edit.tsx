import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

import { CreateRequestWizard } from '@/components/screens/create-request-wizard';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRequest } from '@/hooks/use-requests';

export default function EditRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { data: request, isLoading } = useRequest(id);

  if (isLoading || !request) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <ThemedText>Request not found.</ThemedText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return <CreateRequestWizard editRequest={request} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

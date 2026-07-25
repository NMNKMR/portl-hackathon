import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComplaintCard } from '@/components/complaints/complaint-card';
import { ScreenBackButton } from '@/components/ui/screen-back-button';
import { Text } from '@/components/ui/text';
import { useSocietyComplaints } from '@/hooks/use-complaints';
import { useMyMemberships } from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminComplaintsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'admin' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'admin' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const societyId = membership?.society_id;
  const complaints = useSocietyComplaints(societyId);

  const openDetail = (id: string) => {
    if (!societyId) return;
    router.push({
      pathname: '/(admin)/complaints/[id]',
      params: { id, societyId },
    } as Href);
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-admin">
          Complaints
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-5 pt-3">
        <ScreenBackButton className="mb-3" />

        <Text variant="title" className="text-role-admin">
          Complaints
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-4">
          Society-wide triage · Open → In progress → Resolved
        </Text>

        {complaints.isLoading ? (
          <ActivityIndicator color={colors.roleAdmin} />
        ) : (
          <FlatList
            data={complaints.data ?? []}
            keyExtractor={(item) => item.id}
            refreshing={complaints.isRefetching}
            onRefresh={() => void complaints.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No complaints yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                onPress={() => openDetail(item.id)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

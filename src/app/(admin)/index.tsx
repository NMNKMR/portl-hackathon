import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';

import {
  NeedsAttentionFeed,
  type AttentionItem,
} from '@/components/needs-attention-feed';
import {
  RoleDashboardShell,
  type DashboardQuickAction,
  type DashboardSummaryCard,
} from '@/components/role-dashboard-shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useSocietyComplaints } from '@/hooks/use-complaints';
import { useSocietyNotices } from '@/hooks/use-notices';
import {
  useMyMemberships,
  usePendingMemberships,
  useSociety,
  useSocietyFlats,
} from '@/hooks/use-society';
import { countOpenComplaints } from '@/lib/api/complaints';
import { displayPersonName } from '@/lib/format';
import { pendingFlatLabel } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminHomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{
    societyId?: string;
    code?: string;
  }>();

  const memberships = useMyMemberships();
  const societyId = useMemo(() => {
    if (params.societyId) return params.societyId;
    const admin = (memberships.data ?? []).find(
      (m) => m.role === 'admin' && m.status === 'approved',
    );
    return admin?.society_id;
  }, [params.societyId, memberships.data]);

  const society = useSociety(societyId);
  const pending = usePendingMemberships(societyId);
  const complaints = useSocietyComplaints(societyId);
  const notices = useSocietyNotices(societyId);
  const flats = useSocietyFlats(societyId);
  const code = params.code ?? society.data?.code;
  const pendingRows = pending.data ?? [];
  const openComplaints = countOpenComplaints(complaints.data ?? []);
  const activeNoticeCount = (notices.data ?? []).filter((n) => n.is_active)
    .length;
  const flatCount = flats.data?.length ?? 0;
  const societyName = society.data?.name ?? 'Your society';

  const attentionItems = useMemo((): AttentionItem[] => {
    if (!societyId) return [];
    const items: AttentionItem[] = [];

    for (const row of pendingRows) {
      const name = displayPersonName(row.full_name, 'Member');
      const flat = pendingFlatLabel(row);
      items.push({
        id: `join-${row.id}`,
        title: `Join request · ${name}`,
        subtitle: flat || undefined,
        timestampIso: row.created_at,
        badgeLabel: 'Pending',
        badgeTone: 'pending',
        icon: 'person',
        sortAt: new Date(row.created_at).getTime(),
        onPress: () =>
          router.push({
            pathname: '/(admin)/pending',
            params: { societyId },
          }),
      });
    }

    for (const row of complaints.data ?? []) {
      if (row.status !== 'open' && row.status !== 'in_progress') continue;
      items.push({
        id: `complaint-${row.id}`,
        title: row.category
          ? `${row.category} complaint`
          : 'Open complaint',
        subtitle: row.flat_number
          ? row.block_name
            ? `${row.block_name} · ${row.flat_number}`
            : row.flat_number
          : undefined,
        timestampIso: row.created_at,
        badgeLabel: row.status === 'open' ? 'Open' : 'In progress',
        badgeTone: row.status === 'open' ? 'danger' : 'pending',
        icon: 'construct',
        sortAt: new Date(row.created_at).getTime(),
        onPress: () =>
          router.push({
            pathname: '/(admin)/complaints/[id]',
            params: { id: row.id, societyId },
          } as Href),
      });
    }

    return items;
  }, [societyId, pendingRows, complaints.data, router]);

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'pending',
      labelLines: ['Pending', 'Joins'],
      icon: 'people',
      onPress: () =>
        router.push({
          pathname: '/(admin)/pending',
          params: { societyId: societyId! },
        }),
    },
    {
      id: 'flats',
      labelLines: ['Blocks', '& Flats'],
      icon: 'grid',
      onPress: () =>
        router.push({
          pathname: '/(admin)/flats',
          params: { societyId: societyId! },
        } as unknown as Href),
    },
    {
      id: 'share',
      labelLines: ['Share', 'Code'],
      icon: 'share',
      onPress: () => {
        if (!code) return;
        void Share.share({
          message: `Join ${societyName} on Portl with code: ${code}`,
        });
      },
    },
    {
      id: 'notices',
      labelLines: ['Compose', 'Notice'],
      icon: 'megaphone',
      onPress: () =>
        router.push({
          pathname: '/(admin)/notices',
          params: { societyId: societyId! },
        } as Href),
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'pending',
      label: 'Pending joins',
      value: String(pendingRows.length),
      linkLabel: pendingRows.length > 0 ? 'Review now' : 'View queue',
      icon: 'time',
      onPress: () =>
        router.push({
          pathname: '/(admin)/pending',
          params: { societyId: societyId! },
        }),
    },
    {
      id: 'complaints',
      label: 'Open complaints',
      value: String(openComplaints),
      linkLabel: 'Review now',
      icon: 'construct',
      onPress: () =>
        router.push({
          pathname: '/(admin)/complaints',
          params: { societyId: societyId! },
        } as Href),
    },
    {
      id: 'notices',
      label: 'Active notices',
      value: String(activeNoticeCount),
      linkLabel: 'Read now',
      icon: 'megaphone',
      onPress: () =>
        router.push({
          pathname: '/(admin)/notices',
          params: { societyId: societyId! },
        } as Href),
    },
    {
      id: 'staff',
      label: 'Staff directory',
      value: 'Open',
      linkLabel: 'Manage',
      icon: 'people',
      onPress: () =>
        router.push({
          pathname: '/(admin)/staff',
          params: { societyId: societyId! },
        } as Href),
    },
    {
      id: 'polls',
      label: 'Active polls',
      value: '0',
      linkLabel: 'Open polls',
      icon: 'chart',
      onPress: () =>
        router.push({
          pathname: '/(admin)/polls',
          params: societyId ? { societyId } : undefined,
        } as Href),
    },
    {
      id: 'blocks',
      label: 'Blocks & flats',
      value: String(flatCount),
      linkLabel: 'Manage',
      icon: 'grid',
      onPress: () =>
        router.push({
          pathname: '/(admin)/flats',
          params: { societyId: societyId! },
        } as unknown as Href),
    },
  ];

  if (memberships.isLoading || (societyId && society.isLoading)) {
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
          Admin
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership yet.
        </Text>
        <Button
          className="mt-6"
          label="Go to hub"
          fullWidth
          onPress={() => router.replace('/(app)' as Href)}
        />
      </View>
    );
  }

  return (
    <RoleDashboardShell
      role="admin"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      subtitle={societyName}
      quickActions={quickActions}
      summaryCards={summaryCards}
    >
      <NeedsAttentionFeed
        items={attentionItems}
        onViewAll={() =>
          router.push({
            pathname:
              pendingRows.length > 0
                ? '/(admin)/pending'
                : '/(admin)/complaints',
            params: { societyId },
          } as Href)
        }
      />
    </RoleDashboardShell>
  );
}

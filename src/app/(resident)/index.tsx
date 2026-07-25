import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

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
import { useFlatComplaints } from '@/hooks/use-complaints';
import { useActiveNotices } from '@/hooks/use-notices';
import { useSocietyPolls } from '@/hooks/use-polls';
import {
  useFlatMembers,
  useMyMemberships,
  usePendingHousehold,
} from '@/hooks/use-society';
import { useFlatVisitors, useVisitorRealtime } from '@/hooks/use-visitors';
import { countUnreadNotices } from '@/lib/api/notices';
import { countOpenUnvotedPolls } from '@/lib/api/polls';
import { membershipFlatLabel } from '@/lib/api/society';
import { displayPersonName } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';
import { remainingScans } from '@/lib/visitor-qr';

function comingSoon(label: string) {
  Alert.alert('Coming next', `${label} will land with the next feature slice.`);
}

export default function ResidentHomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ societyId?: string }>();

  const memberships = useMyMemberships();
  const membership = useMemo(() => {
    if (params.societyId) {
      return (memberships.data ?? []).find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return (memberships.data ?? []).find(
      (m) => m.role === 'resident' && m.status === 'approved',
    );
  }, [params.societyId, memberships.data]);

  const isPrimary = membership?.member_type === 'primary';
  const flatId = membership?.flat_id ?? undefined;
  const societyId = membership?.society_id;
  const householdPending = usePendingHousehold(isPrimary ? flatId : undefined);
  const householdPendingCount = householdPending.data?.length ?? 0;
  const flatMembers = useFlatMembers(flatId);
  const householdMemberCount = flatMembers.data?.length ?? 0;

  const flatVisitors = useFlatVisitors(flatId);
  useVisitorRealtime({ flatId, enabled: Boolean(flatId) });
  const pendingVisitorCount = useMemo(
    () =>
      (flatVisitors.data ?? []).filter((v) => v.status === 'pending').length,
    [flatVisitors.data],
  );
  const preApprovalCount = useMemo(
    () =>
      (flatVisitors.data ?? []).filter(
        (v) =>
          v.initiated_by === 'resident' &&
          v.status === 'approved' &&
          remainingScans(v) > 0,
      ).length,
    [flatVisitors.data],
  );
  const activeNotices = useActiveNotices({
    societyId,
    membershipId: membership?.id,
  });
  const unreadNoticeCount = useMemo(
    () => countUnreadNotices(activeNotices.data ?? []),
    [activeNotices.data],
  );
  const societyPolls = useSocietyPolls({
    societyId,
    membershipId: membership?.id,
  });
  const unvotedPollCount = useMemo(
    () => countOpenUnvotedPolls(societyPolls.data ?? []),
    [societyPolls.data],
  );
  const complaints = useFlatComplaints(flatId);

  const flatLabel = membership ? membershipFlatLabel(membership) : null;
  const societyName = membership?.societies?.name ?? 'Your society';
  const subtitle = flatLabel ? `${flatLabel} · ${societyName}` : societyName;

  const openVisitors = (pendingOnly = false) => {
    if (!societyId) return;
    const qs = new URLSearchParams({ societyId });
    if (pendingOnly) qs.set('filter', 'pending');
    router.push(`/(resident)/visitors?${qs.toString()}` as Href);
  };

  const openHousehold = () => {
    if (!societyId || !flatId) return;
    router.push({
      pathname: '/(resident)/household',
      params: { societyId, flatId },
    } as Href);
  };

  const attentionItems = useMemo((): AttentionItem[] => {
    if (!societyId) return [];
    const items: AttentionItem[] = [];

    for (const v of flatVisitors.data ?? []) {
      if (v.status !== 'pending') continue;
      items.push({
        id: `visitor-${v.id}`,
        title: `Visitor approval · ${v.visitor_name.trim() || 'Visitor'}`,
        subtitle: v.visitor_type ?? undefined,
        timestampIso: v.requested_at,
        badgeLabel: 'Pending',
        badgeTone: 'pending',
        icon: 'time',
        sortAt: new Date(v.requested_at).getTime() + 10_000,
        onPress: () =>
          router.push(
            `/(resident)/visitors/${v.id}?societyId=${encodeURIComponent(societyId)}` as Href,
          ),
      });
    }

    if (isPrimary) {
      for (const row of householdPending.data ?? []) {
        const name = displayPersonName(row.full_name, 'Member');
        items.push({
          id: `household-${row.id}`,
          title: `Household join · ${name}`,
          subtitle: 'Awaiting your approval',
          timestampIso: row.created_at,
          badgeLabel: 'Pending',
          badgeTone: 'pending',
          icon: 'people',
          sortAt: new Date(row.created_at).getTime() + 8_000,
          onPress: openHousehold,
        });
      }
    }

    for (const n of activeNotices.data ?? []) {
      if (n.read_at) continue;
      items.push({
        id: `notice-${n.id}`,
        title: `New notice · ${n.title}`,
        subtitle: 'Unread',
        timestampIso: n.created_at,
        badgeLabel: 'Notice',
        badgeTone: 'muted',
        icon: 'megaphone',
        sortAt: new Date(n.created_at).getTime(),
        onPress: () =>
          router.push(
            `/(resident)/notices/${n.id}?societyId=${encodeURIComponent(societyId)}` as Href,
          ),
      });
    }

    for (const poll of societyPolls.data ?? []) {
      if (!poll.is_open || poll.my_vote_option_id) continue;
      items.push({
        id: `poll-${poll.id}`,
        title: `Poll · ${poll.question}`,
        subtitle: 'Your vote needed',
        timestampIso: poll.created_at,
        badgeLabel: 'Vote',
        badgeTone: 'pending',
        icon: 'chart',
        sortAt: new Date(poll.created_at).getTime() + 1_000,
        onPress: () =>
          router.push(
            `/(resident)/polls/${poll.id}?societyId=${encodeURIComponent(societyId)}` as Href,
          ),
      });
    }

    for (const c of complaints.data ?? []) {
      if (c.status !== 'open' && c.status !== 'in_progress') continue;
      items.push({
        id: `complaint-${c.id}`,
        title: c.category ? `${c.category} complaint` : 'Your complaint',
        subtitle: c.status === 'open' ? 'Open ticket' : 'In progress',
        timestampIso: c.created_at,
        badgeLabel: c.status === 'open' ? 'Open' : 'In progress',
        badgeTone: c.status === 'open' ? 'danger' : 'pending',
        icon: 'construct',
        sortAt: new Date(c.created_at).getTime() - 1_000,
        onPress: () =>
          router.push({
            pathname: '/(resident)/complaints/[id]',
            params: { id: c.id, societyId },
          } as Href),
      });
    }

    return items;
    // openHousehold is stable enough via societyId/flatId deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    societyId,
    flatVisitors.data,
    isPrimary,
    householdPending.data,
    activeNotices.data,
    societyPolls.data,
    complaints.data,
    flatId,
    router,
  ]);

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'approve-visitors',
      labelLines: ['Approve', 'Visitors'],
      icon: 'people',
      onPress: () => openVisitors(false),
    },
    {
      id: 'preapprove',
      labelLines: ['Pre', 'Approve'],
      icon: 'qr',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/pre-approvals?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'staff',
      labelLines: ['Manage', 'Staff'],
      icon: 'people',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/staff?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'complaint',
      labelLines: ['Raise', 'Complaint'],
      icon: 'construct',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/complaints?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
  ];

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: 'pending-visitors',
      label: 'Pending visitors',
      value: String(pendingVisitorCount),
      linkLabel: pendingVisitorCount > 0 ? 'Review now' : 'View log',
      icon: 'people',
      onPress: () => openVisitors(true),
    },
    {
      id: 'pre-approvals',
      label: 'Pre-approvals',
      value: String(preApprovalCount),
      linkLabel: preApprovalCount > 0 ? 'View passes' : 'Create',
      icon: 'qr',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/pre-approvals?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'notices',
      label: 'New notices',
      value: String(unreadNoticeCount),
      linkLabel: 'Read now',
      icon: 'megaphone',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/notices?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
    {
      id: 'dues',
      label: 'Maintenance due',
      value: '₹0',
      linkLabel: 'Pay now',
      icon: 'cash',
      onPress: () => comingSoon('Maintenance dues'),
    },
    {
      id: 'household',
      label: 'My household',
      value: String(householdMemberCount),
      linkLabel:
        isPrimary && householdPendingCount > 0 ? 'Review now' : 'Manage',
      icon: 'people',
      onPress: openHousehold,
    },
    {
      id: 'polls',
      label: 'Active polls',
      value: String(unvotedPollCount),
      linkLabel: unvotedPollCount > 0 ? 'Vote now' : 'View polls',
      icon: 'chart',
      onPress: () => {
        if (!societyId) return;
        router.push(
          `/(resident)/polls?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      },
    },
  ];

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Resident
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership yet.
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
      role="resident"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      subtitle={subtitle}
      quickActions={quickActions}
      summaryCards={summaryCards}
    >
      <NeedsAttentionFeed
        items={attentionItems}
        onViewAll={() => openVisitors(pendingVisitorCount > 0)}
      />
    </RoleDashboardShell>
  );
}

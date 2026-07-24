import { ActivityIndicator, View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useFlatMembers } from '@/hooks/use-society';
import type { Flat, FlatMember } from '@/lib/api/society';
import { displayPersonName } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';
import type { MembershipStatus } from '@/types/database';

export type FlatDetailSheetProps = {
  visible: boolean;
  onClose: () => void;
  flat: Pick<Flat, 'id' | 'flat_number' | 'block_name'> | null;
  societyName?: string | null;
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function memberRoleLine(member: FlatMember): string {
  const parts: string[] = [capitalize(member.role)];

  if (member.role === 'resident') {
    if (member.member_type === 'household') {
      parts.push('Household');
    } else if (member.resident_type) {
      parts.push(capitalize(member.resident_type));
    }
    if (member.member_type === 'primary') {
      parts.push('Primary');
    }
  }

  return parts.join(' • ');
}

function statusBadgeTone(
  status: MembershipStatus,
): 'pending' | 'success' | 'danger' | 'muted' {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'danger';
  return 'muted';
}

function FlatMemberRow({ member }: { member: FlatMember }) {
  return (
    <View className="mb-2 rounded-xl border border-border bg-background px-4 py-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="label">{displayPersonName(member.full_name)}</Text>
          <Text variant="caption" tone="muted" className="mt-0.5">
            {formatPhoneDisplay(member.phone)}
          </Text>
        </View>
        <Badge tone={statusBadgeTone(member.status)} label={member.status} />
      </View>
      <Text variant="caption" className="mt-2">
        {memberRoleLine(member)}
      </Text>
    </View>
  );
}

export function FlatDetailSheet({
  visible,
  onClose,
  flat,
  societyName,
}: FlatDetailSheetProps) {
  const colors = useThemeColors();
  const members = useFlatMembers(visible && flat ? flat.id : undefined);

  const blockLabel = flat?.block_name?.trim() || null;
  const subtitleParts = [
    blockLabel,
    societyName?.trim() || null,
  ].filter(Boolean);

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={flat ? `Flat ${flat.flat_number}` : 'Flat'}
      snapPoints={['55%', '85%']}
    >
      {subtitleParts.length > 0 ? (
        <Text variant="caption" tone="muted" className="mb-4">
          {subtitleParts.join(' · ')}
        </Text>
      ) : (
        <View className="mb-2" />
      )}

      <Text variant="label" className="mb-2">
        Members
      </Text>

      {members.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.primary} />
          <Text variant="caption" tone="muted" className="mt-3">
            Loading members…
          </Text>
        </View>
      ) : members.isError ? (
        <View className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <Text variant="body" tone="danger">
            {members.error instanceof Error
              ? members.error.message
              : 'Could not load members'}
          </Text>
        </View>
      ) : (members.data?.length ?? 0) === 0 ? (
        <View className="rounded-xl border border-border bg-background px-4 py-5">
          <Text variant="body" tone="muted">
            No members connected to this flat yet.
          </Text>
        </View>
      ) : (
        <View>
          {(members.data ?? []).map((member) => (
            <FlatMemberRow key={member.id} member={member} />
          ))}
        </View>
      )}
    </AppBottomSheet>
  );
}

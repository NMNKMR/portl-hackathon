import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { staffFlatLabel, type StaffMember } from '@/lib/api/staff';

type StaffMemberCardProps = {
  staff: StaffMember;
  onPress?: () => void;
};

export function StaffMemberCard({ staff, onPress }: StaffMemberCardProps) {
  const body = (
    <View className="mb-3 rounded-xl border border-border bg-card px-4 py-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="label">{staff.name}</Text>
          <Text variant="caption" tone="muted" className="mt-0.5">
            {staff.category_name ?? 'Staff'} · {staffFlatLabel(staff)}
          </Text>
          {staff.phone ? (
            <Text variant="caption" tone="muted" className="mt-1">
              {staff.phone}
            </Text>
          ) : null}
        </View>
        {staff.is_recurring ? (
          <Badge tone="success" label="Recurring" />
        ) : (
          <Badge tone="muted" label="One-time" />
        )}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

import { Image } from 'expo-image';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  VisitorMetaCard,
  type VisitorMetaRow,
} from '@/components/visitors/visitor-meta-card';
import { staffFlatLabel, type StaffMember } from '@/lib/api/staff';
import { formatJoinDate } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';

type StaffHeroProps = {
  staff: StaffMember;
};

export function StaffHero({ staff }: StaffHeroProps) {
  const colors = useThemeColors();
  const categoryLabel = staff.category_name?.trim() || 'Staff';
  const scopeLabel = staff.flat_id ? staffFlatLabel(staff) : 'Society-wide';

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {staff.photo_url ? (
        <Image
          source={{ uri: staff.photo_url }}
          style={{ width: '100%', height: 180 }}
          contentFit="cover"
          accessibilityLabel={`${staff.name} photo`}
        />
      ) : (
        <View className="h-44 w-full items-center justify-center bg-primary/10">
          <Icon
            family="ionic"
            name="construct-outline"
            size={48}
            color={colors.primary}
          />
        </View>
      )}

      <View className="px-4 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="subtitle">{staff.name}</Text>
            <Text variant="caption" tone="muted" className="mt-0.5">
              {categoryLabel} · {scopeLabel}
            </Text>
          </View>
          <Badge
            tone={staff.is_recurring ? 'success' : 'muted'}
            label={staff.is_recurring ? 'Recurring' : 'One-time'}
          />
        </View>
      </View>
    </View>
  );
}

type StaffDetailContentProps = {
  staff: StaffMember;
};

export function StaffDetailContent({ staff }: StaffDetailContentProps) {
  const rows = useMemo((): VisitorMetaRow[] => {
    const scopeLabel = staff.flat_id ? staffFlatLabel(staff) : 'Society-wide';
    return [
      {
        icon: 'call-outline',
        label: 'Phone',
        value: staff.phone ? formatPhoneDisplay(staff.phone) : 'Not provided',
      },
      {
        icon: 'pricetag-outline',
        label: 'Category',
        value: staff.category_name?.trim() || 'Uncategorized',
      },
      {
        icon: 'home-outline',
        label: 'Scope',
        value: scopeLabel,
      },
      {
        icon: 'repeat-outline',
        label: 'Pass type',
        value: staff.is_recurring ? 'Recurring gate pass' : 'One-time entry',
      },
      {
        icon: 'time-outline',
        label: 'Added',
        value: formatJoinDate(staff.created_at) || '—',
      },
    ];
  }, [staff]);

  return (
    <View>
      <StaffHero staff={staff} />
      <VisitorMetaCard className="mt-4" rows={rows} />
    </View>
  );
}

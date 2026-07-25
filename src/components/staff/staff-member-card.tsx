import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { staffFlatLabel, type StaffMember } from '@/lib/api/staff';
import { cn } from '@/lib/cn';
import { formatVisitorListTimestamp } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

const TAG_CLASS = 'px-1.5 py-0';
const TAG_LABEL_CLASS = 'text-[10px] leading-3';

type StaffMemberCardProps = {
  staff: StaffMember;
  onPress?: () => void;
  className?: string;
  /** Resident flat list — scope is implicit */
  hideScope?: boolean;
};

export function StaffMemberCard({
  staff,
  onPress,
  className,
  hideScope = false,
}: StaffMemberCardProps) {
  const colors = useThemeColors();
  const scopeLabel = staff.flat_id ? staffFlatLabel(staff) : 'Society-wide';
  const categoryLabel = staff.category_name?.trim() || 'Staff';
  const addedAt = formatVisitorListTimestamp(staff.created_at);

  const body = (
    <View
      className={cn(
        'mb-3 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-3',
        className,
      )}
    >
      {staff.photo_url ? (
        <Image
          source={{ uri: staff.photo_url }}
          style={{ width: 52, height: 52, borderRadius: 16 }}
          contentFit="cover"
          accessibilityLabel={`${staff.name} photo`}
        />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10">
          <Icon
            family="ionic"
            name="construct-outline"
            size={24}
            color={colors.primary}
          />
        </View>
      )}

      <View className="relative min-h-[52px] min-w-0 flex-1">
        <View className="flex-row items-start gap-2 pr-7">
          <View className="min-w-0 flex-1">
            <Text variant="label" numberOfLines={2}>
              {staff.name}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>
          <View className="max-w-[46%] shrink-0 flex-row flex-wrap justify-end gap-1">
            {!hideScope ? (
              <Badge
                tone="muted"
                label={scopeLabel}
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            <Badge
              tone={staff.is_recurring ? 'success' : 'muted'}
              label={staff.is_recurring ? 'Recurring' : 'One-time'}
              className={TAG_CLASS}
              labelClassName={TAG_LABEL_CLASS}
            />
          </View>
        </View>

        {staff.phone ? (
          <Text variant="caption" tone="muted" className="mt-2" numberOfLines={1}>
            {staff.phone}
          </Text>
        ) : null}

        {addedAt ? (
          <Text
            variant="caption"
            tone="muted"
            className="mt-1.5 text-[11px] leading-4 opacity-80"
          >
            Added · {addedAt}
          </Text>
        ) : null}

        {onPress ? (
          <View className="absolute bottom-0 right-0">
            <Icon
              family="ionic"
              name="arrow-forward"
              size={20}
              color={colors.muted}
            />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-90">
      {body}
    </Pressable>
  );
}

import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatAttentionTimestamp } from '@/lib/format';
import { useThemeColors } from '@/lib/theme-colors';

export type AttentionBadgeTone = 'pending' | 'success' | 'danger' | 'muted';

export type AttentionIcon =
  | 'time'
  | 'people'
  | 'megaphone'
  | 'construct'
  | 'qr'
  | 'shield'
  | 'person'
  | 'chart';

export type AttentionItem = {
  id: string;
  title: string;
  /** Context line — flat, type, etc. (no timestamp) */
  subtitle?: string;
  timestampIso?: string | null;
  badgeLabel: string;
  badgeTone: AttentionBadgeTone;
  icon: AttentionIcon;
  /** Sort key — higher = more urgent / newer */
  sortAt: number;
  onPress: () => void;
};

const ICONS: Record<
  AttentionIcon,
  {
    family: 'ionic';
    name:
      | 'time-outline'
      | 'people-outline'
      | 'megaphone-outline'
      | 'construct-outline'
      | 'qr-code-outline'
      | 'shield-checkmark-outline'
      | 'person-add-outline'
      | 'bar-chart-outline';
  }
> = {
  time: { family: 'ionic', name: 'time-outline' },
  people: { family: 'ionic', name: 'people-outline' },
  megaphone: { family: 'ionic', name: 'megaphone-outline' },
  construct: { family: 'ionic', name: 'construct-outline' },
  qr: { family: 'ionic', name: 'qr-code-outline' },
  shield: { family: 'ionic', name: 'shield-checkmark-outline' },
  person: { family: 'ionic', name: 'person-add-outline' },
  chart: { family: 'ionic', name: 'bar-chart-outline' },
};

type NeedsAttentionFeedProps = {
  items: AttentionItem[];
  maxItems?: number;
  onViewAll?: () => void;
  emptyLabel?: string;
};

export function NeedsAttentionFeed({
  items,
  maxItems = 5,
  onViewAll,
  emptyLabel = "You're all caught up",
}: NeedsAttentionFeedProps) {
  const colors = useThemeColors();

  const sorted = [...items].sort((a, b) => b.sortAt - a.sortAt);
  const visible = sorted.slice(0, maxItems);
  const hasMore = sorted.length > maxItems;

  return (
    <View className="mt-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">Needs attention</Text>
        {hasMore && onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text variant="caption" tone="primary" className="text-[11px]">
              View all
            </Text>
          </Pressable>
        ) : null}
      </View>

      {visible.length === 0 ? (
        <View className="items-center rounded-xl border border-dashed border-border bg-card px-4 py-6">
          <Text variant="caption" tone="muted" className="text-center">
            {emptyLabel}
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {visible.map((item, index) => {
            const iconDef = ICONS[item.icon];
            const timestamp = formatAttentionTimestamp(item.timestampIso);
            const metaLine = [item.subtitle, timestamp]
              .filter(Boolean)
              .join(' · ');

            return (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                className={`flex-row items-center gap-2.5 px-3 py-2.5 active:opacity-90 ${
                  index < visible.length - 1 ? 'border-b border-border' : ''
                }`}
                accessibilityRole="button"
              >
                <View className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon
                    family={iconDef.family}
                    name={iconDef.name}
                    size={16}
                    color={colors.muted}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    variant="caption"
                    className="font-sans-medium text-foreground"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {metaLine ? (
                    <Text
                      variant="caption"
                      tone="muted"
                      className="mt-0.5 text-[10px] leading-tight"
                      numberOfLines={1}
                    >
                      {metaLine}
                    </Text>
                  ) : null}
                </View>
                <View className="shrink-0 flex-row items-center gap-0.5">
                  <Badge
                    tone={item.badgeTone}
                    label={item.badgeLabel}
                    className="self-center px-1.5 py-0.5"
                    labelClassName="text-[10px] leading-tight"
                  />
                  <Icon
                    family="ionic"
                    name="chevron-forward"
                    size={14}
                    color={colors.muted}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

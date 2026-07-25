import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  hasQrPass,
  visitorFlatLabel,
  type VisitorRequest,
} from '@/lib/api/visitors';
import { cn } from '@/lib/cn';
import { formatVisitorListTimestamp } from '@/lib/format';
import { remainingScans } from '@/lib/visitor-qr';
import {
  capitalizeVisitorValue,
  visitorStatusBadgeTone,
  visitorStatusLabel,
} from '@/lib/visitor-status';
import { useThemeColors } from '@/lib/theme-colors';

const TAG_CLASS = 'px-1.5 py-0';
const TAG_LABEL_CLASS = 'text-[10px] leading-3';

export type VisitorRequestCardProps = {
  visitor: VisitorRequest;
  onPress?: () => void;
  trailing?: ReactNode;
  className?: string;
  showChevron?: boolean;
  hideStatus?: boolean;
  /** Resident flat-scoped lists — flat is implicit */
  hideFlat?: boolean;
};

export function VisitorRequestCard({
  visitor,
  onPress,
  trailing,
  className,
  showChevron = true,
  hideStatus = false,
  hideFlat = false,
}: VisitorRequestCardProps) {
  const colors = useThemeColors();
  const statusTone = visitorStatusBadgeTone(visitor.status);
  const statusLabel = visitorStatusLabel(visitor.status);
  const timestamp = formatVisitorListTimestamp(visitor.requested_at);
  const flatLabel = visitorFlatLabel(visitor);
  const typeLabel = capitalizeVisitorValue(visitor.visitor_type);
  const name = visitor.visitor_name.trim() || 'Visitor';
  const scansLeft = remainingScans(visitor);
  const showEntries =
    visitor.initiated_by === 'resident' && visitor.max_scans > 1;

  const body = (
    <View
      className={cn(
        'mb-3 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-3',
        className,
      )}
    >
      {visitor.photo_url ? (
        <Image
          source={{ uri: visitor.photo_url }}
          style={{ width: 52, height: 52, borderRadius: 16 }}
          contentFit="cover"
          accessibilityLabel={`${name} photo`}
        />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10">
          <Icon family="ionic" name="person-outline" size={24} color={colors.primary} />
        </View>
      )}

      <View className="relative min-h-[52px] min-w-0 flex-1">
        <View className="flex-row items-start gap-2 pr-7">
          <View className="min-w-0 flex-1">
            <Text variant="label" numberOfLines={2}>
              {name}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5" numberOfLines={1}>
              {typeLabel}
            </Text>
          </View>
          <View className="max-w-[46%] shrink-0 flex-row flex-wrap justify-end gap-1">
            {!hideStatus ? (
              <Badge
                tone={statusTone}
                label={statusLabel}
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            {!hideFlat ? (
              <Badge
                tone="muted"
                label={flatLabel}
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            {hasQrPass(visitor) ? (
              <Badge
                tone="pending"
                label="QR"
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
            {showEntries ? (
              <Badge
                tone={scansLeft === 0 ? 'muted' : 'success'}
                label={`${visitor.scan_count}/${visitor.max_scans}`}
                className={TAG_CLASS}
                labelClassName={TAG_LABEL_CLASS}
              />
            ) : null}
          </View>
        </View>

        {timestamp ? (
          <Text
            variant="caption"
            tone="muted"
            className="mt-2 text-[11px] leading-4 opacity-80"
          >
            {visitor.initiated_by === 'resident' ? 'Pre-approved' : 'Requested'}{' '}
            · {timestamp}
          </Text>
        ) : null}

        {trailing ? (
          <View className="absolute bottom-0 right-0">{trailing}</View>
        ) : onPress && showChevron ? (
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

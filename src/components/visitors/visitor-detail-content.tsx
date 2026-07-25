import { useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { VisitorHero } from '@/components/visitors/visitor-hero';
import {
  VisitorMetaCard,
  type VisitorMetaRow,
} from '@/components/visitors/visitor-meta-card';
import {
  hasQrPass,
  visitorFlatLabel,
  type VisitorRequest,
} from '@/lib/api/visitors';
import { formatJoinDate } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { remainingScans } from '@/lib/visitor-qr';
import { capitalizeVisitorValue } from '@/lib/visitor-status';

type VisitorDetailContentProps = {
  visitor: VisitorRequest;
  variant?: 'banner' | 'compact';
};

export function VisitorDetailContent({
  visitor,
  variant = 'banner',
}: VisitorDetailContentProps) {
  const name = visitor.visitor_name.trim() || 'Visitor';
  const subtitle = `${capitalizeVisitorValue(visitor.visitor_type)} · ${visitorFlatLabel(visitor)}`;

  const vehicleLine = [
    visitor.vehicle_number?.trim(),
    visitor.vehicle_type && visitor.vehicle_type !== 'none'
      ? capitalizeVisitorValue(visitor.vehicle_type)
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const rows = useMemo((): VisitorMetaRow[] => {
    const out: VisitorMetaRow[] = [
      {
        icon: 'call-outline',
        label: 'Phone',
        value: visitor.visitor_phone
          ? formatPhoneDisplay(visitor.visitor_phone)
          : 'Not provided',
      },
      {
        icon: 'car-outline',
        label: 'Vehicle',
        value: vehicleLine || 'None',
      },
      {
        icon: 'time-outline',
        label: 'Requested',
        value: formatJoinDate(visitor.requested_at) || '—',
      },
    ];

    if (visitor.approved_at) {
      out.push({
        icon: 'checkmark-circle-outline',
        label: 'Approved',
        value: formatJoinDate(visitor.approved_at) || '—',
      });
    }
    if (visitor.checked_in_at) {
      out.push({
        icon: 'log-in-outline',
        label: 'Checked in',
        value: formatJoinDate(visitor.checked_in_at) || '—',
      });
    }
    if (visitor.checked_out_at) {
      out.push({
        icon: 'log-out-outline',
        label: 'Checked out',
        value: formatJoinDate(visitor.checked_out_at) || '—',
      });
    }
    if (visitor.initiated_by === 'resident' && visitor.max_scans > 1) {
      out.push({
        icon: 'repeat-outline',
        label: 'Entries',
        value: `${visitor.scan_count}/${visitor.max_scans} used · ${remainingScans(visitor)} left`,
      });
    }
    out.push({
      icon: 'home-outline',
      label: 'Flat',
      value: visitorFlatLabel(visitor),
    });
    out.push({
      icon: 'person-outline',
      label: 'Initiated by',
      value: capitalizeVisitorValue(visitor.initiated_by),
    });

    return out;
  }, [vehicleLine, visitor]);

  return (
    <View>
      <VisitorHero
        name={name}
        photoUrl={visitor.photo_url}
        status={visitor.status}
        subtitle={subtitle}
        variant={variant}
      />

      {hasQrPass(visitor) ? (
        <View className="mt-3 flex-row">
          <Badge tone="pending" label="QR pass — scan at gate" />
        </View>
      ) : null}

      <VisitorMetaCard className="mt-4" rows={rows} />
    </View>
  );
}

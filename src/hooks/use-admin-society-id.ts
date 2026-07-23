import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { useMyMemberships } from '@/hooks/use-society';

export function useAdminSocietyId() {
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const societyId = useMemo(() => {
    if (params.societyId) return params.societyId;
    const admin = (memberships.data ?? []).find(
      (m) => m.role === 'admin' && m.status === 'approved',
    );
    return admin?.society_id;
  }, [params.societyId, memberships.data]);

  return {
    societyId,
    isLoading: memberships.isLoading,
  };
}

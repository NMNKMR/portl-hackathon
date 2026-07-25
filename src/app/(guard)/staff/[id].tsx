import { useLocalSearchParams } from 'expo-router';

import { StaffDetailScreen } from '@/components/staff/staff-detail-screen';

export default function GuardStaffDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  return <StaffDetailScreen staffId={id} role="guard" mode="verify" />;
}

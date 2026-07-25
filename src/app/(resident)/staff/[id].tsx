import { useLocalSearchParams } from 'expo-router';

import { StaffDetailScreen } from '@/components/staff/staff-detail-screen';

export default function ResidentStaffDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  return (
    <StaffDetailScreen
      staffId={id}
      titleClassName="text-role-resident"
      mode="manage"
    />
  );
}

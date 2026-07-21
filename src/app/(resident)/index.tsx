import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function ResidentHomeScreen() {
  return (
    <View className="flex-1 bg-background px-6 justify-center gap-3">
      <Text variant="title" className="text-role-resident">
        Resident
      </Text>
      <Text variant="body" tone="muted">
        Empty shell — approvals, notices, and home feed land here.
      </Text>
    </View>
  );
}

import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function AdminHomeScreen() {
  return (
    <View className="flex-1 bg-background px-6 justify-center gap-3">
      <Text variant="title" className="text-role-admin">
        Admin
      </Text>
      <Text variant="body" tone="muted">
        Empty shell — society setup and dashboard land here.
      </Text>
    </View>
  );
}

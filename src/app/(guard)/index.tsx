import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function GuardHomeScreen() {
  return (
    <View className="flex-1 bg-background px-6 justify-center gap-3">
      <Text variant="title" className="text-role-guard">
        Guard
      </Text>
      <Text variant="body" tone="muted">
        Empty shell — register visitor and gate log land here.
      </Text>
    </View>
  );
}

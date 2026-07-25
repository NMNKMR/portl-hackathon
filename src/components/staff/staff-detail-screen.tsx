import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaffDetailContent } from '@/components/staff/staff-detail-content';
import { StaffPassQrCard } from '@/components/staff/staff-pass-qr-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { useStaffMember } from '@/hooks/use-staff';
import { useThemeColors } from '@/lib/theme-colors';

type StaffDetailScreenProps = {
  staffId: string;
  role: 'admin' | 'resident' | 'guard';
  mode: 'manage' | 'verify';
  onVerified?: () => void;
};

export function StaffDetailScreen({
  staffId,
  role,
  mode,
  onVerified,
}: StaffDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const staffQuery = useStaffMember(staffId);
  const [verified, setVerified] = useState(false);

  const staff = staffQuery.data;

  if (staffQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader role={role} title="Staff" showBack />
        <Text variant="body" tone="muted" className="mt-2">
          Staff member not found.
        </Text>
      </View>
    );
  }

  const showVerifyFooter = mode === 'verify' && !verified;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-5">
        <VisitorFlowHeader
          role={role}
          title={mode === 'verify' ? 'Verify staff' : 'Staff pass'}
          subtitle={staff.name}
          showBack
          backLabel="Back"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (showVerifyFooter ? 120 : 32),
        }}
        showsVerticalScrollIndicator={false}
      >
        <StaffDetailContent staff={staff} />

        {mode === 'verify' ? (
          verified ? (
            <View className="mt-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-5">
              <View className="mb-3 self-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <Icon
                    family="ionic"
                    name="checkmark-circle"
                    size={48}
                    color={colors.success}
                  />
                </View>
              </View>
              <Text variant="subtitle" className="text-center text-success">
                Verified — allow entry
              </Text>
              <Text variant="caption" tone="muted" className="mt-2 text-center">
                Identity matches the directory entry. No visitor request was
                created.
              </Text>
            </View>
          ) : (
            <View className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4">
              <Text variant="label">Gate check</Text>
              <Text variant="body" tone="muted" className="mt-2">
                Confirm this person matches the photo and details above, then
                mark verified.
              </Text>
            </View>
          )
        ) : (
          <View className="mt-6">
            <StaffPassQrCard staff={staff} />
          </View>
        )}
      </ScrollView>

      {showVerifyFooter ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button
            label="Mark verified"
            fullWidth
            variant="accent"
            onPress={() => {
              setVerified(true);
              onVerified?.();
            }}
          />
        </View>
      ) : mode === 'verify' && verified ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button
            label="Done"
            fullWidth
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      ) : null}
    </View>
  );
}

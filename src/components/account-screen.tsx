import { useRouter, type Href } from 'expo-router';
import { Pressable, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { DashboardBottomNav } from '@/components/dashboard-bottom-nav';
import type { DashboardRole } from '@/components/role-dashboard-shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { displayPersonName } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import { useThemeColors } from '@/lib/theme-colors';

type AccountScreenProps = {
  role: DashboardRole;
  userName?: string | null;
  phone?: string | null;
  societyName?: string | null;
  /** Admin-only society join code card */
  societyCode?: string | null;
};

function roleLabel(role: DashboardRole) {
  if (role === 'admin') return 'Admin';
  if (role === 'guard') return 'Guard';
  return 'Resident';
}

function roleAccent(
  role: DashboardRole,
  colors: ReturnType<typeof useThemeColors>,
) {
  if (role === 'admin') return colors.roleAdmin;
  if (role === 'guard') return colors.roleGuard;
  return colors.roleResident;
}

function roleAccentClass(role: DashboardRole) {
  if (role === 'admin') return 'text-role-admin';
  if (role === 'guard') return 'text-role-guard';
  return 'text-role-resident';
}

export function AccountScreen({
  role,
  userName,
  phone,
  societyName,
  societyCode,
}: AccountScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const accent = roleAccent(role, colors);

  const handleShareCode = async () => {
    if (!societyCode) return;
    const name = societyName?.trim() || 'our society';
    try {
      await Share.share({
        message: `Join ${name} on Portl with code: ${societyCode}`,
      });
    } catch {
      // Share cancelled or unavailable — code remains visible on screen.
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="title" className={roleAccentClass(role)}>
          Account
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          Profile and society settings
        </Text>

        <View className="mt-6 rounded-2xl border border-border bg-card px-4 py-4">
          <View className="flex-row items-center gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accent}22` }}
            >
              <Icon
                family="ionic"
                name="person"
                size={28}
                color={accent}
              />
            </View>
            <View className="flex-1">
              <Text variant="subtitle">
                {displayPersonName(userName, 'Member')}
              </Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                {formatPhoneDisplay(phone)}
              </Text>
              <Text variant="caption" className={`mt-1 ${roleAccentClass(role)}`}>
                {roleLabel(role)}
                {societyName ? ` · ${societyName}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {role === 'admin' && societyCode ? (
          <Pressable
            onPress={() => void handleShareCode()}
            className="mt-4 rounded-xl border border-border bg-card px-4 py-3"
          >
            <Text variant="caption" tone="muted">
              Society code
            </Text>
            <View className="mt-1 flex-row items-center justify-between">
              <Text variant="subtitle" className="tracking-widest">
                {societyCode}
              </Text>
              <Icon
                family="ionic"
                name="share-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text variant="caption" tone="primary" className="mt-1">
              Tap to share
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/(app)' as Href)}
          className="mt-4 flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <View className="flex-1 pr-3">
            <Text variant="label">Societies</Text>
            <Text variant="caption" tone="muted" className="mt-0.5">
              Switch society or manage memberships
            </Text>
          </View>
          <Icon
            family="ionic"
            name="chevron-forward"
            size={18}
            color={colors.muted}
          />
        </Pressable>

        <SignOutButton className="mt-8" />
      </View>

      <DashboardBottomNav role={role} roleAccent={accent} activeTab="account" />
    </View>
  );
}

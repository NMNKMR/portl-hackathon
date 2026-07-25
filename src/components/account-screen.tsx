import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignOutButton } from '@/components/auth/sign-out-button';
import type { DashboardRole } from '@/components/role-dashboard-shell';
import { AppBottomSheet, BottomSheetFormFields } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile, uploadAvatar } from '@/lib/api/auth';
import { displayPersonName } from '@/lib/format';
import { formatPhoneDisplay } from '@/lib/phone';
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from '@/lib/storage';
import { useThemeColors } from '@/lib/theme-colors';

type AccountScreenProps = {
  role: DashboardRole;
  societyId?: string | null;
  societyName?: string | null;
  societyCode?: string | null;
  flatId?: string | null;
  flatLabel?: string | null;
  /** Primary residents only — household pending approvals. */
  showHousehold?: boolean;
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

function roleBadgeClass(role: DashboardRole) {
  if (role === 'admin') return 'bg-role-admin/15 text-role-admin';
  if (role === 'guard') return 'bg-role-guard/15 text-role-guard';
  return 'bg-role-resident/15 text-role-resident';
}

type RowProps = {
  title: string;
  subtitle?: string;
  icon: 'people' | 'grid' | 'share' | 'home' | 'create' | 'person' | 'business';
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function AccountRow({ title, subtitle, icon, onPress, colors }: RowProps) {
  const iconName =
    icon === 'people'
      ? ('people-outline' as const)
      : icon === 'grid'
        ? ('grid-outline' as const)
        : icon === 'share'
          ? ('share-outline' as const)
          : icon === 'home'
            ? ('home-outline' as const)
            : icon === 'business'
              ? ('business-outline' as const)
              : icon === 'create'
                ? ('create-outline' as const)
                : ('person-outline' as const);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3 active:opacity-90"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <Icon family="ionic" name={iconName} size={20} color={colors.primary} />
      </View>
      <View className="flex-1 pr-2">
        <Text variant="label">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" className="mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon
        family="ionic"
        name="chevron-forward"
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}

function SocietyCodeCard({
  code,
  societyName,
  onShare,
  colors,
}: {
  code: string;
  societyName?: string | null;
  onShare: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onShare}
      className="rounded-xl border border-border bg-card px-4 py-3 active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text variant="caption" tone="muted">
            Invite code
          </Text>
          <Text variant="subtitle" className="mt-0.5 tracking-widest">
            {code}
          </Text>
          {societyName ? (
            <Text variant="caption" tone="muted" className="mt-1">
              Share with new {societyName} members
            </Text>
          ) : null}
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon
            family="ionic"
            name="share-outline"
            size={20}
            color={colors.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

export function AccountScreen({
  role,
  societyId,
  societyName,
  societyCode,
  flatId,
  flatLabel,
  showHousehold = false,
}: AccountScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const accent = roleAccent(role, colors);
  const showSocietySection = role !== 'guard';
  const { profile, refreshProfile } = useAuth();

  const [theme, setTheme] = useState<ThemePreference>('system');
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.full_name ?? '');
  const [avatarDraft, setAvatarDraft] = useState<string | null>(
    profile?.avatar_url ?? null,
  );
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void getThemePreference().then(setTheme);
  }, []);

  useEffect(() => {
    if (editOpen) {
      setNameDraft(profile?.full_name ?? '');
      setAvatarDraft(profile?.avatar_url ?? null);
      setAvatarBase64(null);
      setFormError(null);
    }
  }, [editOpen, profile?.full_name, profile?.avatar_url]);

  const handleThemeChange = (next: ThemePreference) => {
    setTheme(next);
    void setThemePreference(next);
  };

  const handleShareCode = async () => {
    if (!societyCode) return;
    const name = societyName?.trim() || 'our society';
    try {
      await Share.share({
        message: `Join ${name} on Portl with code: ${societyCode}`,
      });
    } catch {
      // cancelled
    }
  };

  const openMembershipHub = () => {
    router.push({
      pathname: '/(app)',
      params: { manage: '1' },
    } as Href);
  };

  const pickAvatar = async () => {
    setPicking(true);
    setFormError(null);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFormError('Photo library permission is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarDraft(result.assets[0].uri);
        setAvatarBase64(result.assets[0].base64 ?? null);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not pick photo',
      );
    } finally {
      setPicking(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const isLocalUri =
        !!avatarDraft &&
        (avatarDraft.startsWith('file:') ||
          avatarDraft.startsWith('content:') ||
          avatarDraft.startsWith('ph://') ||
          (!avatarDraft.startsWith('http://') &&
            !avatarDraft.startsWith('https://')));

      const patch: { fullName: string; avatarUrl?: string | null } = {
        fullName: nameDraft,
      };

      if (avatarDraft && isLocalUri) {
        patch.avatarUrl = await uploadAvatar({
          localUri: avatarDraft,
          base64: avatarBase64,
        });
      }

      await updateProfile(patch);
      await refreshProfile();
      setEditOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not save profile',
      );
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = profile?.avatar_url;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="title" className={roleAccentClass(role)}>
          Account
        </Text>
        <Text variant="caption" tone="muted" className="mt-1">
          Profile, society, and app preferences
        </Text>

        {/* Profile — display only; edit is a separate row */}
        <View className="mt-6 rounded-2xl border border-border bg-card px-4 py-4">
          <View className="flex-row items-center gap-3">
            <View
              className="h-16 w-16 items-center justify-center overflow-hidden rounded-full"
              style={{ backgroundColor: `${accent}22` }}
            >
              {displayAvatar ? (
                <Image
                  key={displayAvatar}
                  source={{ uri: displayAvatar }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                />
              ) : (
                <Icon family="ionic" name="person" size={30} color={accent} />
              )}
            </View>
            <View className="flex-1">
              <Text variant="subtitle">
                {displayPersonName(profile?.full_name, 'Member')}
              </Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                {formatPhoneDisplay(profile?.phone)}
              </Text>
              <View
                className={`mt-2 self-start rounded-full px-2.5 py-0.5 ${roleBadgeClass(role)}`}
              >
                <Text variant="caption" className={roleAccentClass(role)}>
                  {roleLabel(role)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-3">
          <AccountRow
            title="Edit profile"
            subtitle="Update your name and photo"
            icon="create"
            colors={colors}
            onPress={() => setEditOpen(true)}
          />
        </View>

        {showSocietySection ? (
          <>
            <Text variant="label" className="mt-8 mb-2">
              Society
            </Text>

            {societyName ? (
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      family="ionic"
                      name="business-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{societyName}</Text>
                    {flatLabel ? (
                      <Text variant="caption" tone="muted" className="mt-0.5">
                        {flatLabel}
                      </Text>
                    ) : (
                      <Text variant="caption" tone="muted" className="mt-0.5">
                        Current society
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : null}

            <View className="mt-3 gap-3">
              {societyCode ? (
                <SocietyCodeCard
                  code={societyCode}
                  societyName={societyName}
                  onShare={() => void handleShareCode()}
                  colors={colors}
                />
              ) : null}

              <AccountRow
                title="Switch society"
                subtitle="View memberships or join another society"
                icon="business"
                colors={colors}
                onPress={openMembershipHub}
              />

              {role === 'admin' && societyId ? (
                <>
                  <AccountRow
                    title="Pending joins"
                    subtitle="Approve or reject membership requests"
                    icon="people"
                    colors={colors}
                    onPress={() =>
                      router.push({
                        pathname: '/(admin)/pending',
                        params: { societyId },
                      })
                    }
                  />
                  <AccountRow
                    title="Blocks & flats"
                    subtitle="Organize towers, wings, and flats"
                    icon="grid"
                    colors={colors}
                    onPress={() =>
                      router.push({
                        pathname: '/(admin)/flats',
                        params: { societyId },
                      } as Href)
                    }
                  />
                </>
              ) : null}

              {role === 'resident' && showHousehold && societyId ? (
                <AccountRow
                  title="Household"
                  subtitle="Pending household members for your flat"
                  icon="people"
                  colors={colors}
                  onPress={() =>
                    router.push({
                      pathname: '/(resident)/household',
                      params: {
                        societyId,
                        ...(flatId ? { flatId } : {}),
                      },
                    } as Href)
                  }
                />
              ) : null}
            </View>
          </>
        ) : null}

        {/* Theme */}
        <Text variant="label" className="mt-8 mb-2">
          Appearance
        </Text>
        <SegmentedControl
          value={theme}
          onChange={handleThemeChange}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />

        <SignOutButton className="mt-10 mb-4" />
      </ScrollView>

      <AppBottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        snapPoints={['70%', '90%']}
        footer={
          <View>
            <Button
              label="Save"
              fullWidth
              loading={saving}
              onPress={() => void saveProfile()}
            />
            <Button
              className="mt-2"
              label="Cancel"
              variant="ghost"
              fullWidth
              onPress={() => setEditOpen(false)}
            />
          </View>
        }
      >
        <KeyboardAvoidingView behavior="padding">
          <BottomSheetFormFields>
            <View className="items-center py-2">
              <Pressable
                onPress={() => void pickAvatar()}
                disabled={picking || saving}
                className="items-center"
              >
                <View
                  className="h-24 w-24 items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: `${accent}22` }}
                >
                  {picking ? (
                    <ActivityIndicator color={accent} />
                  ) : avatarDraft ? (
                    <Image
                      key={avatarDraft}
                      source={{ uri: avatarDraft }}
                      style={{ width: 96, height: 96 }}
                      contentFit="cover"
                      recyclingKey={avatarDraft}
                    />
                  ) : (
                    <Icon family="ionic" name="person" size={40} color={accent} />
                  )}
                </View>
                <Text variant="caption" tone="primary" className="mt-2">
                  Change photo
                </Text>
              </Pressable>
            </View>

            <TextInput
              label="Full name"
              value={nameDraft}
              onChangeText={setNameDraft}
              autoCapitalize="words"
              placeholder="Your name"
            />

            {formError ? (
              <Text variant="caption" tone="danger">
                {formError}
              </Text>
            ) : null}
          </BottomSheetFormFields>
        </KeyboardAvoidingView>
      </AppBottomSheet>
    </View>
  );
}

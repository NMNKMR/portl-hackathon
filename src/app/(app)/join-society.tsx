import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import {
  useFlatJoinInfo,
  useLookupSociety,
  useRequestMembership,
  useSocietyFlats,
} from '@/hooks/use-society';
import { useThemeColors } from '@/lib/theme-colors';
import type { ResidentMemberType, ResidentType } from '@/types/database';

type JoinRole = 'resident' | 'guard';

const NO_BLOCK = '__none__';

const ROLE_OPTIONS = [
  {
    value: 'resident' as const,
    label: 'Resident',
    icon: { family: 'ionic' as const, name: 'person-outline' as const },
  },
  {
    value: 'guard' as const,
    label: 'Guard',
    icon: { family: 'ionic' as const, name: 'shield-outline' as const },
  },
];

const RESIDENT_TYPE_OPTIONS = [
  {
    value: 'owner' as const,
    label: 'Owner',
    icon: { family: 'ionic' as const, name: 'home-outline' as const },
  },
  {
    value: 'tenant' as const,
    label: 'Tenant',
    icon: { family: 'ionic' as const, name: 'key-outline' as const },
  },
];

export default function JoinSocietyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const lookup = useLookupSociety();
  const request = useRequestMembership();

  const [code, setCode] = useState('');
  const [role, setRole] = useState<JoinRole>('resident');
  const [residentType, setResidentType] = useState<ResidentType>('owner');
  const [blockKey, setBlockKey] = useState<string | null>(null);
  const [flatId, setFlatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [society, setSociety] = useState<{ id: string; name: string } | null>(
    null,
  );

  const flatsQuery = useSocietyFlats(society?.id);
  const flats = flatsQuery.data ?? [];
  const joinInfoQuery = useFlatJoinInfo(
    role === 'resident' ? flatId ?? undefined : undefined,
  );
  const joinInfo = joinInfoQuery.data;
  const joiningAsHousehold = Boolean(joinInfo?.has_primary);

  useEffect(() => {
    if (joiningAsHousehold && joinInfo?.primary_resident_type) {
      setResidentType(joinInfo.primary_resident_type);
    }
  }, [joiningAsHousehold, joinInfo?.primary_resident_type]);

  const blockOptions = useMemo(() => {
    const map = new Map<string, string>();
    let hasDirect = false;
    for (const flat of flats) {
      if (flat.block_id && flat.block_name) {
        map.set(flat.block_id, flat.block_name);
      } else if (!flat.block_id) {
        hasDirect = true;
      }
    }
    const options = [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    if (hasDirect) {
      options.push({ value: NO_BLOCK, label: 'No block (direct flats)' });
    }
    return options;
  }, [flats]);

  const hasBlocks = blockOptions.some((o) => o.value !== NO_BLOCK);
  const onlyDirectFlats = flats.length > 0 && !hasBlocks;

  const flatOptions = useMemo(() => {
    let filtered = flats;
    if (hasBlocks) {
      if (!blockKey) return [];
      if (blockKey === NO_BLOCK) {
        filtered = flats.filter((f) => !f.block_id);
      } else {
        filtered = flats.filter((f) => f.block_id === blockKey);
      }
    }
    return filtered
      .slice()
      .sort((a, b) => a.flat_number.localeCompare(b.flat_number))
      .map((f) => ({ value: f.id, label: f.flat_number }));
  }, [flats, hasBlocks, blockKey]);

  const canSubmit = useMemo(() => {
    if (!society) return false;
    if (role === 'guard') return true;
    if (!flatId) return false;
    if (joinInfoQuery.isLoading || joinInfoQuery.isFetching) return false;
    return true;
  }, [society, role, flatId, joinInfoQuery.isLoading, joinInfoQuery.isFetching]);

  const handleLookup = async () => {
    setError(null);
    setSociety(null);
    setBlockKey(null);
    setFlatId(null);

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Enter the society join code');
      return;
    }

    try {
      const found = await lookup.mutateAsync(trimmed);
      if (!found) {
        setError('No society found for that code');
        return;
      }
      setSociety(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    }
  };

  const handleJoin = async () => {
    if (!society) return;
    setError(null);

    if (role === 'resident' && !flatId) {
      setError('Pick your flat');
      return;
    }

    const memberType: ResidentMemberType | undefined =
      role === 'resident'
        ? joiningAsHousehold
          ? 'household'
          : 'primary'
        : undefined;

    try {
      await request.mutateAsync({
        societyId: society.id,
        role,
        flatId: role === 'resident' ? flatId ?? undefined : undefined,
        residentType: role === 'resident' ? residentType : undefined,
        memberType,
      });
      router.replace('/(app)' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request join');
    }
  };

  const pendingApproverHint = joiningAsHousehold
    ? 'A primary resident already lives in this flat. You’ll join as a household member — they approve your request.'
    : 'Your request stays pending until the society admin approves.';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        >
          <Pressable onPress={() => router.back()} className="mb-4 self-start">
            <Text variant="label" tone="primary">
              Back
            </Text>
          </Pressable>

          <Text variant="title">Join society</Text>
          <Text variant="body" tone="muted" className="mt-2">
            Enter the code provided by your admin or flat primary.
          </Text>

          <View className="mt-8 gap-4">
            <View>
              <Text variant="label" className="mb-2">
                Society code
              </Text>
              <View className="flex-row items-end gap-2">
                <View className="flex-1">
                  <TextInput
                    placeholder="e.g. K7M2QX"
                    value={code}
                    onChangeText={(v) => setCode(v.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <Button
                  label="Find society"
                  variant="outline"
                  loading={lookup.isPending}
                  onPress={() => void handleLookup()}
                  className="mb-0 min-w-[120px]"
                />
              </View>
            </View>

            {society ? (
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      family="ionic"
                      name="business-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{society.name}</Text>
                    <Text variant="caption" tone="muted" className="mt-0.5">
                      Join code {code.trim().toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {society ? (
              <View>
                <Text variant="label" className="mb-2">
                  I am joining as
                </Text>
                <SegmentedControl
                  options={ROLE_OPTIONS}
                  value={role}
                  onChange={(next) => {
                    setRole(next);
                    if (next === 'guard') {
                      setBlockKey(null);
                      setFlatId(null);
                    }
                  }}
                />
              </View>
            ) : null}

            {society && role === 'resident' ? (
              <View className="gap-4">
                {flatsQuery.isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : flats.length === 0 ? (
                  <Text variant="caption" tone="muted">
                    No flats yet. Ask the admin to add flats, then try again.
                  </Text>
                ) : (
                  <>
                    {hasBlocks && !onlyDirectFlats ? (
                      <SelectField
                        label="Block / Tower"
                        placeholder="Select a block"
                        value={blockKey}
                        options={blockOptions}
                        onChange={(next) => {
                          setBlockKey(next);
                          setFlatId(null);
                        }}
                      />
                    ) : null}

                    <SelectField
                      label="Flat / Unit No."
                      placeholder={
                        hasBlocks && !blockKey
                          ? 'Select a block first'
                          : 'Select your flat'
                      }
                      value={flatId}
                      options={flatOptions}
                      disabled={hasBlocks && !onlyDirectFlats && !blockKey}
                      emptyMessage={
                        hasBlocks && blockKey
                          ? 'No flats in this block'
                          : 'No flats available'
                      }
                      onChange={setFlatId}
                    />
                  </>
                )}
              </View>
            ) : null}

            {society && role === 'resident' && flatId ? (
              joinInfoQuery.isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : joiningAsHousehold ? (
                <View className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
                  <Text variant="label" className="text-accent">
                    Joining as household member
                  </Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    {pendingApproverHint}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text variant="label" className="mb-2">
                    As a resident, I am
                  </Text>
                  <SegmentedControl
                    options={RESIDENT_TYPE_OPTIONS}
                    value={residentType}
                    onChange={setResidentType}
                  />
                  <Text variant="caption" tone="muted" className="mt-2">
                    {pendingApproverHint}
                  </Text>
                </View>
              )
            ) : null}

            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}

            {society ? (
              <Button
                label="Request to join"
                variant="accent"
                fullWidth
                disabled={!canSubmit}
                loading={request.isPending}
                onPress={() => void handleJoin()}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

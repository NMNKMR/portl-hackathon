import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaffMemberCard } from '@/components/staff/staff-member-card';
import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import {
  useCreateStaffMember,
  useStaffCategories,
  useStaffDirectory,
} from '@/hooks/use-staff';
import { useThemeColors } from '@/lib/theme-colors';

type RoleAccent = 'admin' | 'resident' | 'guard';

type StaffDirectoryScreenProps = {
  role: RoleAccent;
  societyId: string;
  membershipId: string;
  /** When set, list/create scoped to this flat (resident). */
  flatId?: string | null;
  canCreate?: boolean;
  titleClassName: string;
  detailHref: (staffId: string) => Href;
};

export function StaffDirectoryScreen({
  role,
  societyId,
  membershipId,
  flatId,
  canCreate = true,
  titleClassName,
  detailHref,
}: StaffDirectoryScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const categories = useStaffCategories(societyId, {
    seedIfMissing: role === 'admin',
  });
  const directory = useStaffDirectory({
    societyId,
    flatId: role === 'resident' ? flatId : null,
    societyLevelOnly: role === 'admin',
  });
  const createStaff = useCreateStaffMember();

  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () =>
      (categories.data ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories.data],
  );

  const filtered = useMemo(() => {
    const rows = directory.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q) ||
        (s.category_name ?? '').toLowerCase().includes(q),
    );
  }, [directory.data, query]);

  const accent =
    role === 'admin'
      ? colors.roleAdmin
      : role === 'guard'
        ? colors.roleGuard
        : colors.roleResident;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }
    setFormError(null);
    try {
      const created = await createStaff.mutateAsync({
        societyId,
        flatId: role === 'resident' ? flatId : null,
        name: trimmed,
        phone: phone.trim() || null,
        categoryId,
        isRecurring: true,
        membershipId,
      });
      setSheetOpen(false);
      setName('');
      setPhone('');
      setCategoryId(null);
      router.push(detailHref(created.id));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add staff');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-5 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="mb-3 flex-row items-center gap-1 self-start"
          hitSlop={8}
        >
          <Icon
            family="ionic"
            name="chevron-back"
            size={20}
            color={colors.primary}
          />
          <Text variant="label" tone="primary">
            Back
          </Text>
        </Pressable>

        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" className={titleClassName}>
              Staff directory
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              {role === 'guard'
                ? 'Verify recurring passes at the gate'
                : role === 'admin'
                  ? 'Society-wide service staff with recurring gate passes'
                  : 'Your flat’s service staff with recurring gate passes'}
            </Text>
          </View>
          {canCreate ? (
            <Button
              label="Add"
              size="sm"
              variant="accent"
              onPress={() => setSheetOpen(true)}
            />
          ) : null}
        </View>

        <TextInput
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Name, phone, or category"
          autoCapitalize="none"
        />

        {directory.isLoading || categories.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={accent} />
          </View>
        ) : directory.isError ? (
          <View className="mt-8">
            <Text variant="caption" tone="danger">
              {directory.error instanceof Error
                ? directory.error.message
                : 'Could not load staff'}
            </Text>
            <Button
              className="mt-3"
              label="Retry"
              variant="outline"
              onPress={() => void directory.refetch()}
            />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshing={directory.isRefetching}
            onRefresh={() => void directory.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted" className="text-center">
                  {query
                    ? 'No matches'
                    : 'No staff yet. Add a recurring service person.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <StaffMemberCard
                staff={item}
                onPress={() => router.push(detailHref(item.id))}
              />
            )}
          />
        )}
      </View>

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Add staff"
        snapPoints={['70%', '90%']}
        footer={
          <View>
            <Button
              label="Save"
              fullWidth
              loading={createStaff.isPending}
              onPress={() => void submit()}
            />
            <Button
              className="mt-2"
              label="Cancel"
              variant="ghost"
              fullWidth
              onPress={() => setSheetOpen(false)}
            />
          </View>
        }
      >
        <KeyboardAvoidingView behavior="padding">
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="e.g. Ramesh"
          />
          <TextInput
            className="mt-3"
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Optional"
          />
          {categories.isError ? (
            <Text variant="caption" tone="danger" className="mt-3">
              {categories.error instanceof Error
                ? categories.error.message
                : 'Could not load categories'}
            </Text>
          ) : categoryOptions.length > 0 ? (
            <View className="mt-3">
              <SelectField
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
              />
            </View>
          ) : role === 'admin' ? (
            <Text variant="caption" tone="muted" className="mt-3">
              Default categories will appear after the first save.
            </Text>
          ) : (
            <Text variant="caption" tone="muted" className="mt-3">
              No categories yet. Ask an admin to open Staff once, or save
              without a category.
            </Text>
          )}
          {formError ? (
            <Text variant="caption" tone="danger" className="mt-3">
              {formError}
            </Text>
          ) : null}
        </KeyboardAvoidingView>
      </AppBottomSheet>
    </View>
  );
}

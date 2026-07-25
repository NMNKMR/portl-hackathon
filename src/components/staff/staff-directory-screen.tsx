import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaffMemberCard } from '@/components/staff/staff-member-card';
import { AppBottomSheet, BottomSheetFormFields } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { VisitorFilterChips } from '@/components/visitors/visitor-filter-chips';
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import {
  useCreateStaffMember,
  useStaffCategories,
  useStaffDirectory,
} from '@/hooks/use-staff';
import {
  buildStaffCategoryFilters,
  filterStaffByCategory,
  filterStaffByQuery,
  type StaffCategoryFilter,
} from '@/lib/staff-filters';
import { useThemeColors } from '@/lib/theme-colors';

type RoleAccent = 'admin' | 'resident' | 'guard';

type StaffDirectoryScreenProps = {
  role: RoleAccent;
  societyId: string;
  membershipId: string;
  flatId?: string | null;
  canCreate?: boolean;
  showBack?: boolean;
  detailHref: (staffId: string) => Href;
};

function roleChipClasses(role: RoleAccent) {
  if (role === 'admin') {
    return {
      activeContainerClassName: 'border-role-admin bg-role-admin/15',
      activeLabelClassName: 'text-role-admin',
    };
  }
  if (role === 'guard') {
    return {
      activeContainerClassName: 'border-role-guard bg-role-guard/15',
      activeLabelClassName: 'text-role-guard',
    };
  }
  return {
    activeContainerClassName: 'border-role-resident bg-role-resident/15',
    activeLabelClassName: 'text-role-resident',
  };
}

export function StaffDirectoryScreen({
  role,
  societyId,
  membershipId,
  flatId,
  canCreate = true,
  showBack = true,
  detailHref,
}: StaffDirectoryScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const chipClasses = roleChipClasses(role);

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
  const [categoryFilter, setCategoryFilter] = useState<StaffCategoryFilter>('all');
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

  const categoryFilters = useMemo(
    () => buildStaffCategoryFilters(directory.data ?? []),
    [directory.data],
  );

  const filtered = useMemo(() => {
    const rows = directory.data ?? [];
    const byCategory = filterStaffByCategory(rows, categoryFilter);
    return filterStaffByQuery(byCategory, query);
  }, [categoryFilter, directory.data, query]);

  const accent =
    role === 'admin'
      ? colors.roleAdmin
      : role === 'guard'
        ? colors.roleGuard
        : colors.roleResident;

  const subtitle =
    role === 'guard'
      ? 'Verify recurring passes at the gate'
      : role === 'admin'
        ? 'Society-wide service staff'
        : 'Service staff for your flat';

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
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <VisitorFlowHeader
          role={role}
          title="Staff"
          subtitle={subtitle}
          caption={
            filtered.length > 0
              ? `${filtered.length} member${filtered.length === 1 ? '' : 's'}`
              : undefined
          }
          showBack={showBack}
          rightSlot={
            canCreate ? (
              <Button
                label="Add"
                size="sm"
                variant="accent"
                onPress={() => setSheetOpen(true)}
              />
            ) : undefined
          }
        />

        <View className="mt-4 rounded-2xl border border-border bg-card px-4 py-3">
          <TextInput
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, phone, or category"
            autoCapitalize="none"
          />
        </View>

        {categoryFilters.length > 1 ? (
          <View className="mt-3">
            <VisitorFilterChips
              filters={categoryFilters}
              value={categoryFilter}
              onChange={setCategoryFilter}
              {...chipClasses}
            />
          </View>
        ) : null}

        {directory.isLoading || categories.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={accent} />
          </View>
        ) : directory.isError ? (
          <View className="mt-8 items-center px-4">
            <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
              <Icon
                family="ionic"
                name="alert-circle-outline"
                size={28}
                color={colors.danger}
              />
            </View>
            <Text variant="label" className="text-center">
              Could not load staff
            </Text>
            <Text variant="body" tone="muted" className="mt-1 text-center">
              {directory.error instanceof Error
                ? directory.error.message
                : 'Please try again.'}
            </Text>
            <Button
              className="mt-4"
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
            contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16 px-4">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Icon
                    family="ionic"
                    name="construct-outline"
                    size={28}
                    color={colors.muted}
                  />
                </View>
                <Text variant="label" className="text-center">
                  {query || categoryFilter !== 'all'
                    ? 'No matches'
                    : 'No staff yet'}
                </Text>
                <Text variant="body" tone="muted" className="mt-1 text-center">
                  {query || categoryFilter !== 'all'
                    ? 'Try another search or category filter.'
                    : 'Add recurring service people with gate passes.'}
                </Text>
                {canCreate && !query && categoryFilter === 'all' ? (
                  <Button
                    className="mt-5"
                    label="Add staff"
                    variant="accent"
                    onPress={() => setSheetOpen(true)}
                  />
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <StaffMemberCard
                staff={item}
                hideScope={role === 'resident'}
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
          <BottomSheetFormFields>
            <View className="rounded-2xl border border-border bg-neutral-50 px-4 py-4 dark:bg-neutral-900">
              <BottomSheetFormFields>
                <TextInput
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="e.g. Ramesh"
                />
                <TextInput
                  label="Phone (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Contact number"
                />
                {categories.isError ? (
                  <Text variant="caption" tone="danger">
                    {categories.error instanceof Error
                      ? categories.error.message
                      : 'Could not load categories'}
                  </Text>
                ) : categoryOptions.length > 0 ? (
                  <SelectField
                    label="Category"
                    value={categoryId}
                    onChange={setCategoryId}
                    options={categoryOptions}
                  />
                ) : role === 'admin' ? (
                  <Text variant="caption" tone="muted">
                    Default categories appear after the first save.
                  </Text>
                ) : (
                  <Text variant="caption" tone="muted">
                    No categories yet. Ask an admin to open Staff once, or save
                    without a category.
                  </Text>
                )}
              </BottomSheetFormFields>
            </View>
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

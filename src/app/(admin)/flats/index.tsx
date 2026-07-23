import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/admin/admin-screen-header';
import { CreateBlockSheet } from '@/components/admin/create-block-sheet';
import { Button } from '@/components/ui/button';
import { EmptyIllustration } from '@/components/ui/empty-illustration';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useAdminSocietyId } from '@/hooks/use-admin-society-id';
import {
  useCreateBlock,
  useSociety,
  useSocietyBlocks,
  useSocietyFlats,
  useUpdateBlock,
} from '@/hooks/use-society';
import { formatBlockTypeLabel } from '@/lib/api/society';
import { useThemeColors } from '@/lib/theme-colors';
import type { BlockType } from '@/types/database';

const emptyBlocksImage = require('../../../../assets/images/empty-blocks.png');

export default function BlocksIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { societyId, isLoading: societyIdLoading } = useAdminSocietyId();

  const society = useSociety(societyId);
  const blocks = useSocietyBlocks(societyId);
  const flats = useSocietyFlats(societyId);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();

  const [createVisible, setCreateVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [renameBlockId, setRenameBlockId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const blockList = blocks.data ?? [];
  const flatList = flats.data ?? [];

  const flatCountByBlock = useMemo(() => {
    const map = new Map<string, number>();
    for (const flat of flatList) {
      if (!flat.block_id) continue;
      map.set(flat.block_id, (map.get(flat.block_id) ?? 0) + 1);
    }
    return map;
  }, [flatList]);

  const directFlatCount = useMemo(
    () => flatList.filter((flat) => flat.block_id === null).length,
    [flatList],
  );

  const isEmpty = blockList.length === 0 && flatList.length === 0;
  const isLoading =
    societyIdLoading || blocks.isLoading || flats.isLoading || society.isLoading;

  const handleCreateBlock = async (input: { name: string; type: BlockType }) => {
    if (!societyId) return;
    setError(null);
    try {
      await createBlock.mutateAsync({
        societyId,
        name: input.name,
        type: input.type,
      });
      setCreateVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create block');
    }
  };

  const openRename = (blockId: string, currentName: string) => {
    setRenameBlockId(blockId);
    setRenameName(currentName);
    setError(null);
  };

  const handleRename = async () => {
    if (!societyId || !renameBlockId) return;
    const trimmed = renameName.trim();
    if (trimmed.length < 1) {
      setError('Enter a block name');
      return;
    }
    setError(null);
    try {
      await updateBlock.mutateAsync({
        blockId: renameBlockId,
        societyId,
        name: trimmed,
      });
      setRenameBlockId(null);
      setRenameName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename block');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId) {
    return (
      <View
        className="flex-1 bg-background px-6 justify-center"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text variant="title">No society</Text>
        <Button
          className="mt-6"
          label="Back"
          fullWidth
          onPress={() => router.back()}
        />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        >
          <AdminScreenHeader
            title="Blocks & flats"
            subtitle={society.data?.name ?? 'Society'}
          />

          <EmptyIllustration source={emptyBlocksImage} />

          <Text variant="subtitle" className="mt-2 text-center">
            No blocks or flats yet.
          </Text>
          <Text variant="body" tone="muted" className="mt-2 text-center">
            Organize your society by creating blocks and adding flats, or add
            flats directly without blocks.
          </Text>

          <Button
            className="mt-8"
            label="Create a block"
            fullWidth
            onPress={() => setCreateVisible(true)}
          />
          <Button
            className="mt-3"
            label="Continue without blocks"
            variant="outline"
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/(admin)/flats/direct',
                params: { societyId },
              })
            }
          />
          <Text variant="caption" tone="muted" className="mt-4 text-center">
            Add flats directly to the society. You can organize them into blocks
            later.
          </Text>
        </ScrollView>

        <CreateBlockSheet
          visible={createVisible}
          loading={createBlock.isPending}
          onClose={() => setCreateVisible(false)}
          onSubmit={(input) => void handleCreateBlock(input)}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <AdminScreenHeader
          title="Blocks"
          subtitle={society.data?.name ?? 'Society'}
          rightSlot={
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => setCreateVisible(true)} hitSlop={8}>
                <Text variant="caption" className="text-role-admin">
                  Create block
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditMode((value) => !value);
                  setError(null);
                }}
                hitSlop={8}
              >
                <Text variant="caption" className="text-role-admin">
                  {editMode ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            </View>
          }
        />

        <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-role-admin/20 bg-role-admin/5 px-4 py-3">
          <Icon
            family="ionic"
            name="information-circle-outline"
            size={20}
            color={colors.roleAdmin}
          />
          <Text variant="caption" tone="muted" className="flex-1">
            Blocks help you manage flats and residents better.
          </Text>
        </View>

        {blockList.length === 0 ? (
          <Text variant="body" tone="muted" className="mb-4">
            No blocks yet. Create one or manage direct flats below.
          </Text>
        ) : (
          <View className="gap-2">
            {blockList.map((block) => {
              const count = flatCountByBlock.get(block.id) ?? 0;
              const flatLabel = count === 1 ? 'flat' : 'flats';
              return (
                <Pressable
                  key={block.id}
                  onPress={() => {
                    if (editMode) {
                      openRename(block.id, block.name);
                      return;
                    }
                    router.push({
                      pathname: '/(admin)/flats/[blockId]',
                      params: { blockId: block.id, societyId },
                    });
                  }}
                  className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3 active:opacity-90"
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-role-admin/10">
                    <Icon
                      family="materialCommunity"
                      name="office-building-outline"
                      size={22}
                      color={colors.roleAdmin}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="label">{block.name}</Text>
                    <Text variant="caption" tone="muted" className="mt-0.5">
                      {formatBlockTypeLabel(block.type)} · {count} {flatLabel}
                    </Text>
                  </View>
                  <Icon
                    family="ionic"
                    name={editMode ? 'pencil-outline' : 'chevron-forward'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          className="mt-6 flex-row items-center gap-2 self-start"
          onPress={() =>
            router.push({
              pathname: '/(admin)/flats/direct',
              params: { societyId },
            })
          }
        >
          <Icon
            family="materialCommunity"
            name="target"
            size={18}
            color={colors.roleAdmin}
          />
          <Text variant="label" className="text-role-admin">
            View direct flats
            {directFlatCount > 0 ? ` (${directFlatCount})` : ''}
          </Text>
        </Pressable>
        <Text variant="caption" tone="muted" className="mt-1">
          Flats that are not in any block.
        </Text>

        {error ? (
          <Text variant="caption" tone="danger" className="mt-4">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <CreateBlockSheet
        visible={createVisible}
        loading={createBlock.isPending}
        onClose={() => setCreateVisible(false)}
        onSubmit={(input) => void handleCreateBlock(input)}
      />

      <Modal
        visible={renameBlockId !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setRenameBlockId(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl border border-border bg-card p-5">
            <Text variant="subtitle">Rename block</Text>
            <TextInput
              className="mt-4"
              label="Block name"
              value={renameName}
              onChangeText={setRenameName}
              autoCapitalize="words"
            />
            {error ? (
              <Text variant="caption" tone="danger" className="mt-2">
                {error}
              </Text>
            ) : null}
            <Button
              className="mt-4"
              label="Save"
              fullWidth
              loading={updateBlock.isPending}
              onPress={() => void handleRename()}
            />
            <Button
              className="mt-2"
              label="Cancel"
              variant="ghost"
              fullWidth
              onPress={() => {
                setRenameBlockId(null);
                setError(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

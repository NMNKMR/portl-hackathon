import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardBottomNav } from '@/components/dashboard-bottom-nav';
import { NoticeCard } from '@/components/notices/notice-card';
import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useCreateNotice, useSocietyNotices } from '@/hooks/use-notices';
import { useMyMemberships } from '@/hooks/use-society';
import { uploadNoticePhoto } from '@/lib/api/notice-photos';
import type { Notice } from '@/lib/api/notices';
import { useThemeColors } from '@/lib/theme-colors';

export default function AdminNoticesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();
  const memberships = useMyMemberships();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'admin' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'admin' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const societyId = membership?.society_id;
  const notices = useSocietyNotices(societyId);
  const createNotice = useCreateNotice();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openDetail = (notice: Notice) => {
    const href = societyId
      ? (`/(admin)/notices/${notice.id}?societyId=${encodeURIComponent(societyId)}` as Href)
      : (`/(admin)/notices/${notice.id}` as Href);
    router.push(href);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const resetCompose = () => {
    setTitle('');
    setBody('');
    setValidDays('7');
    setPhotoUri(null);
    setPhotoBase64(null);
    setError(null);
  };

  const submit = async () => {
    if (!membership || !societyId) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const days = Number.parseInt(validDays, 10);
    const validTill =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null;

    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadNoticePhoto({
          societyId,
          localUri: photoUri,
          base64: photoBase64,
        });
      }

      await createNotice.mutateAsync({
        societyId,
        membershipId: membership.id,
        title: title.trim(),
        body: body.trim() || null,
        photoUrl,
        validTill,
      });
      setSheetOpen(false);
      resetCompose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post notice');
    }
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-admin">
          Notices
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved admin membership.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="title" className="text-role-admin">
              Notices
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              Post society announcements
            </Text>
          </View>
          <Button
            label="Compose"
            size="sm"
            variant="accent"
            onPress={() => setSheetOpen(true)}
          />
        </View>

        {notices.isLoading ? (
          <ActivityIndicator color={colors.roleAdmin} />
        ) : (
          <FlatList
            data={notices.data ?? []}
            keyExtractor={(item) => item.id}
            refreshing={notices.isRefetching}
            onRefresh={() => void notices.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No notices yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NoticeCard notice={item} onPress={() => openDetail(item)} />
            )}
          />
        )}
      </View>

      <DashboardBottomNav
        role="admin"
        roleAccent={colors.roleAdmin}
        activeTab="notices"
      />

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Compose notice"
        snapPoints={['75%', '92%']}
        footer={
          <View>
            <Button
              label="Post"
              fullWidth
              loading={createNotice.isPending}
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
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Notice title"
          />
          <TextInput
            className="mt-3"
            label="Body"
            value={body}
            onChangeText={setBody}
            placeholder="Details"
            multiline
          />
          <Pressable
            onPress={() => void pickPhoto()}
            className="mt-3 h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card"
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Text variant="caption" tone="muted">
                Add photo (optional)
              </Text>
            )}
          </Pressable>
          <TextInput
            className="mt-3"
            label="Active for (days)"
            value={validDays}
            onChangeText={setValidDays}
            keyboardType="number-pad"
            helperText="Leave blank or 0 for no expiry"
          />
          {error ? (
            <Text variant="caption" tone="danger" className="mt-3">
              {error}
            </Text>
          ) : null}
        </KeyboardAvoidingView>
      </AppBottomSheet>
    </View>
  );
}

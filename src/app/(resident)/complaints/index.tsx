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

import { ComplaintCard } from '@/components/complaints/complaint-card';
import { AppBottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import {
  useCreateComplaint,
  useFlatComplaints,
} from '@/hooks/use-complaints';
import { useMyMemberships } from '@/hooks/use-society';
import { uploadComplaintPhoto } from '@/lib/api/complaint-photos';
import { useThemeColors } from '@/lib/theme-colors';

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

export default function ResidentComplaintsScreen() {
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
          m.role === 'resident' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'resident' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const complaints = useFlatComplaints(membership?.flat_id ?? undefined);
  const createComplaint = useCreateComplaint();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [category, setCategory] = useState<string | null>('plumbing');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openDetail = (id: string) => {
    if (!membership?.society_id) return;
    router.push({
      pathname: '/(resident)/complaints/[id]',
      params: { id, societyId: membership.society_id },
    } as Href);
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

  const submit = async () => {
    if (!membership?.society_id || !membership.flat_id) return;
    if (!category) {
      setError('Select a category');
      return;
    }
    if (!description.trim()) {
      setError('Describe the issue');
      return;
    }
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadComplaintPhoto({
          societyId: membership.society_id,
          localUri: photoUri,
          base64: photoBase64,
        });
      }
      await createComplaint.mutateAsync({
        societyId: membership.society_id,
        flatId: membership.flat_id,
        membershipId: membership.id,
        category,
        description: description.trim(),
        photoUrl,
      });
      setSheetOpen(false);
      setDescription('');
      setPhotoUri(null);
      setPhotoBase64(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not raise complaint');
    }
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership?.flat_id) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Complaints
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident flat.
        </Text>
        <Button
          className="mt-6"
          label="Go to hub"
          fullWidth
          onPress={() => router.replace('/(app)' as Href)}
        />
      </View>
    );
  }

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
            <Text variant="title" className="text-role-resident">
              Complaints
            </Text>
            <Text variant="body" tone="muted" className="mt-1">
              Raise and track issues for your flat
            </Text>
          </View>
          <Button
            label="Raise"
            size="sm"
            variant="accent"
            onPress={() => setSheetOpen(true)}
          />
        </View>

        {complaints.isLoading ? (
          <ActivityIndicator color={colors.roleResident} />
        ) : (
          <FlatList
            data={complaints.data ?? []}
            keyExtractor={(item) => item.id}
            refreshing={complaints.isRefetching}
            onRefresh={() => void complaints.refetch()}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text variant="body" tone="muted">
                  No complaints yet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                onPress={() => openDetail(item.id)}
              />
            )}
          />
        )}
      </View>

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Raise complaint"
        snapPoints={['75%', '92%']}
        footer={
          <View>
            <Button
              label="Submit"
              fullWidth
              loading={createComplaint.isPending}
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
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
          />
          <TextInput
            className="mt-3"
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What needs attention?"
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

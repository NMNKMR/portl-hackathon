import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';

import {
  AppBottomSheet,
  BottomSheetFormFields,
} from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useCreateNotice, useUpdateNotice } from '@/hooks/use-notices';
import { uploadNoticePhoto } from '@/lib/api/notice-photos';
import type { Notice } from '@/lib/api/notices';

type NoticeFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  societyId: string;
  membershipId: string;
  mode?: 'create' | 'edit';
  notice?: Notice | null;
};

function daysUntil(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return '0';
  return String(Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000))));
}

export function NoticeFormSheet({
  visible,
  onClose,
  societyId,
  membershipId,
  mode = 'create',
  notice = null,
}: NoticeFormSheetProps) {
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const isEdit = mode === 'edit' && notice;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (isEdit && notice) {
      setTitle(notice.title);
      setBody(notice.body ?? '');
      setValidDays(daysUntil(notice.valid_till));
      setPhotoUri(notice.photo_url);
      setPhotoBase64(null);
    } else {
      setTitle('');
      setBody('');
      setValidDays('7');
      setPhotoUri(null);
      setPhotoBase64(null);
    }
    setError(null);
  }, [visible, isEdit, notice]);

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
      let photoUrl: string | null | undefined;
      if (photoUri && photoBase64) {
        photoUrl = await uploadNoticePhoto({
          societyId,
          localUri: photoUri,
          base64: photoBase64,
        });
      } else if (photoUri && photoUri.startsWith('http')) {
        photoUrl = photoUri;
      } else if (!photoUri) {
        photoUrl = null;
      }

      if (isEdit && notice) {
        await updateNotice.mutateAsync({
          id: notice.id,
          title: title.trim(),
          body: body.trim() || null,
          ...(photoUrl !== undefined ? { photoUrl } : {}),
          validTill,
        });
      } else {
        await createNotice.mutateAsync({
          societyId,
          membershipId,
          title: title.trim(),
          body: body.trim() || null,
          photoUrl: photoUrl ?? null,
          validTill,
        });
      }

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? 'Could not update notice'
            : 'Could not post notice',
      );
    }
  };

  const pending = createNotice.isPending || updateNotice.isPending;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit notice' : 'Compose notice'}
      snapPoints={['75%', '92%']}
      footer={
        <View>
          <Button
            label={isEdit ? 'Save changes' : 'Post'}
            fullWidth
            loading={pending}
            onPress={() => void submit()}
          />
          <Button
            className="mt-2"
            label="Cancel"
            variant="ghost"
            fullWidth
            onPress={onClose}
          />
        </View>
      }
    >
      <KeyboardAvoidingView behavior="padding">
        <BottomSheetFormFields>
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Notice title"
          />
          <TextInput
            label="Body"
            value={body}
            onChangeText={setBody}
            placeholder="Details"
            multiline
          />
          <Pressable
            onPress={() => void pickPhoto()}
            className="h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card"
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
            label="Active for (days)"
            value={validDays}
            onChangeText={setValidDays}
            keyboardType="number-pad"
            helperText="Leave blank or 0 for no expiry"
          />
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
        </BottomSheetFormFields>
      </KeyboardAvoidingView>
    </AppBottomSheet>
  );
}

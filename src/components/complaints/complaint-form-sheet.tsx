import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';

import {
  AppBottomSheet,
  BottomSheetFormFields,
} from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useUpdateComplaint } from '@/hooks/use-complaints';
import type { Complaint } from '@/lib/api/complaints';
import { uploadComplaintPhoto } from '@/lib/api/complaint-photos';

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

type ComplaintFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  complaint: Complaint;
  societyId: string;
};

export function ComplaintFormSheet({
  visible,
  onClose,
  complaint,
  societyId,
}: ComplaintFormSheetProps) {
  const updateComplaint = useUpdateComplaint();
  const [category, setCategory] = useState(complaint.category ?? 'other');
  const [description, setDescription] = useState(complaint.description ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(complaint.photo_url);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCategory(complaint.category ?? 'other');
    setDescription(complaint.description ?? '');
    setPhotoUri(complaint.photo_url);
    setPhotoBase64(null);
    setError(null);
  }, [visible, complaint]);

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
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setError(null);
    try {
      let photoUrl: string | null | undefined;
      if (photoUri && photoBase64) {
        photoUrl = await uploadComplaintPhoto({
          societyId,
          localUri: photoUri,
          base64: photoBase64,
        });
      } else if (photoUri && photoUri.startsWith('http')) {
        photoUrl = photoUri;
      } else if (!photoUri) {
        photoUrl = null;
      }

      await updateComplaint.mutateAsync({
        id: complaint.id,
        category,
        description: description.trim(),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update complaint');
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit your complaint"
      snapPoints={['75%', '92%']}
      footer={
        <View>
          <Button
            label="Save changes"
            fullWidth
            loading={updateComplaint.isPending}
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
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What needs attention?"
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

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SelectField } from '@/components/ui/select-field';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useMyMemberships, useSocietyFlats } from '@/hooks/use-society';
import { useCreateVisitorRequest } from '@/hooks/use-visitors';
import { formatFlatLabel } from '@/lib/api/society';
import { uploadVisitorPhoto } from '@/lib/api/visitor-photos';
import { useThemeColors } from '@/lib/theme-colors';
import type { VehicleType, VisitorType } from '@/types/database';

const VISITOR_TYPE_OPTIONS = [
  { value: 'guest', label: 'Guest' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'cab', label: 'Cab' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'other', label: 'Other' },
];

export default function GuardRegisterVisitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();

  const memberships = useMyMemberships();
  const createVisitor = useCreateVisitorRequest();

  const membership = useMemo(() => {
    const rows = memberships.data ?? [];
    if (params.societyId) {
      return rows.find(
        (m) =>
          m.society_id === params.societyId &&
          m.role === 'guard' &&
          m.status === 'approved',
      );
    }
    return rows.find((m) => m.role === 'guard' && m.status === 'approved');
  }, [memberships.data, params.societyId]);

  const societyId = membership?.society_id;
  const flatsQuery = useSocietyFlats(societyId);

  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType | null>('guest');
  const [flatId, setFlatId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>('none');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const flatOptions = useMemo(() => {
    const flats = flatsQuery.data ?? [];
    return [...flats]
      .sort((a, b) =>
        formatFlatLabel(a).localeCompare(formatFlatLabel(b), undefined, {
          numeric: true,
        }),
      )
      .map((flat) => ({
        value: flat.id,
        label: formatFlatLabel(flat),
      }));
  }, [flatsQuery.data]);

  const pickPhoto = () => {
    Alert.alert('Visitor photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => void takePhoto(),
      },
      {
        text: 'Photo library',
        onPress: () => void pickFromLibrary(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required for photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!membership || !societyId) return;

    const name = visitorName.trim();
    if (!name) {
      setError('Visitor name is required');
      return;
    }
    if (!visitorType) {
      setError('Select a visitor type');
      return;
    }
    if (!flatId) {
      setError('Select a flat');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadVisitorPhoto({
          societyId,
          localUri: photoUri,
          base64: photoBase64,
        });
      }

      const resolvedVehicleType =
        !vehicleType || vehicleType === 'none' ? null : vehicleType;

      await createVisitor.mutateAsync({
        societyId,
        flatId,
        guardMembershipId: membership.id,
        initiatedBy: 'guard',
        visitorName: name,
        visitorPhone: phone.trim() || null,
        visitorType,
        photoUrl,
        vehicleNumber: vehicleNumber.trim() || null,
        vehicleType: resolvedVehicleType,
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(
          `/(guard)/visitors?societyId=${encodeURIComponent(societyId)}` as Href,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not register visitor',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (memberships.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership || !societyId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-guard">
          Register visitor
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved guard membership yet.
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
    <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <Text variant="title" className="text-role-guard">
          Register visitor
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-6">
          Capture details at the gate for resident approval.
        </Text>

        <Pressable
          onPress={pickPhoto}
          className="mb-5 h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card"
        >
          {photoUri ? (
            <Image
              key={photoUri}
              source={{ uri: photoUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View className="items-center px-4">
              <Icon
                family="ionic"
                name="camera-outline"
                size={32}
                color={colors.muted}
              />
              <Text variant="label" className="mt-2">
                Add photo
              </Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                Camera or library (optional)
              </Text>
            </View>
          )}
        </Pressable>
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)} className="mb-4 self-start">
            <Text variant="caption" tone="danger">
              Remove photo
            </Text>
          </Pressable>
        ) : null}

        <View className="mb-4">
          <TextInput
            label="Visitor name"
            value={visitorName}
            onChangeText={setVisitorName}
            placeholder="Full name"
            autoCapitalize="words"
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Visitor type"
            placeholder="Select type"
            value={visitorType}
            options={VISITOR_TYPE_OPTIONS}
            onChange={(value) => setVisitorType(value as VisitorType)}
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Flat"
            placeholder="Select flat"
            value={flatId}
            options={flatOptions}
            emptyMessage={
              flatsQuery.isLoading ? 'Loading flats…' : 'No flats yet'
            }
            onChange={setFlatId}
          />
        </View>

        <View className="mb-4">
          <TextInput
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Visitor phone"
            keyboardType="phone-pad"
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Vehicle type (optional)"
            placeholder="Select vehicle"
            value={vehicleType}
            options={VEHICLE_TYPE_OPTIONS}
            onChange={(value) => setVehicleType(value as VehicleType)}
          />
        </View>

        {vehicleType && vehicleType !== 'none' ? (
          <View className="mb-4">
            <TextInput
              label="Vehicle number (optional)"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g. MH 01 AB 1234"
              autoCapitalize="characters"
            />
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" tone="danger" className="mb-3">
            {error}
          </Text>
        ) : null}

        <Button
          label="Submit request"
          variant="accent"
          fullWidth
          loading={submitting || createVisitor.isPending}
          onPress={() => void handleSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

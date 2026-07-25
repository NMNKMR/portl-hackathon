import { Image } from 'expo-image';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useMyMemberships } from '@/hooks/use-society';
import { useCreateGuestPreApproval } from '@/hooks/use-visitors';
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

export default function ResidentPreApproveCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ societyId?: string }>();

  const memberships = useMyMemberships();
  const createPre = useCreateGuestPreApproval();

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

  const societyId = membership?.society_id;
  const flatId = membership?.flat_id;

  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType | null>('guest');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>('none');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [maxScans, setMaxScans] = useState('1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const importContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Contacts access is required.');
      return;
    }
    const picked = await Contacts.presentContactPickerAsync();
    if (!picked) return;
    if (picked.name) setVisitorName(picked.name);
    const number =
      picked.phoneNumbers?.find((p) => p.number)?.number ??
      picked.phoneNumbers?.[0]?.number;
    if (number) setPhone(number.replace(/\s+/g, ''));
  };

  const save = async () => {
    if (!membership || !societyId || !flatId) return;
    const name = visitorName.trim();
    if (!name) {
      setError('Visitor name is required');
      return;
    }
    if (!visitorType) {
      setError('Select a visitor type');
      return;
    }
    const scans = Number.parseInt(maxScans, 10);
    if (!Number.isFinite(scans) || scans < 1) {
      setError('Allowed entries must be at least 1');
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

      const row = await createPre.mutateAsync({
        societyId,
        flatId,
        membershipId: membership.id,
        visitorName: name,
        visitorPhone: phone.trim() || null,
        visitorType,
        photoUrl,
        vehicleNumber: vehicleNumber.trim() || null,
        vehicleType: resolvedVehicleType,
        maxScans: scans,
        withQr: false,
      });

      router.replace(
        `/(resident)/pre-approvals/${row.id}?societyId=${encodeURIComponent(societyId)}` as Href,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save pre-approval');
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

  if (!membership || !societyId || !flatId) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text variant="title" className="text-role-resident">
          Pre-approve
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          No approved resident membership yet.
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

  const photoHint =
    visitorType === 'cab' ||
    visitorType === 'delivery' ||
    visitorType === 'service';

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

        <Text variant="title" className="text-role-resident">
          Pre-approve visitor
        </Text>
        <Text variant="body" tone="muted" className="mt-1 mb-5">
          Create the pass first. Generate a QR on the next screen if you want to
          share it.
        </Text>

        <Button
          className="mb-4"
          label="Import from contacts"
          variant="outline"
          icon={{ family: 'ionic', name: 'people-outline' }}
          fullWidth
          onPress={() => void importContact()}
        />

        <Pressable
          onPress={() => void pickPhoto()}
          className="mb-4 h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card"
        >
          {photoUri ? (
            <Image
              key={photoUri}
              source={{ uri: photoUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="items-center px-4">
              <Icon
                family="ionic"
                name="camera-outline"
                size={28}
                color={colors.muted}
              />
              <Text variant="label" className="mt-2">
                {photoHint ? 'Photo recommended' : 'Add photo (optional)'}
              </Text>
              <Text variant="caption" tone="muted" className="mt-1 text-center">
                Helps the guard verify cab, delivery, or service visitors
              </Text>
            </View>
          )}
        </Pressable>

        <TextInput
          label="Name"
          value={visitorName}
          onChangeText={setVisitorName}
          autoCapitalize="words"
          placeholder="Visitor name"
        />
        <TextInput
          className="mt-3"
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Optional"
        />

        <View className="mt-3">
          <SelectField
            label="Type"
            value={visitorType}
            onChange={(v) => setVisitorType(v as VisitorType)}
            options={VISITOR_TYPE_OPTIONS}
          />
        </View>

        <View className="mt-3">
          <SelectField
            label="Vehicle"
            value={vehicleType}
            onChange={(v) => setVehicleType(v as VehicleType)}
            options={VEHICLE_TYPE_OPTIONS}
          />
        </View>

        {vehicleType && vehicleType !== 'none' ? (
          <TextInput
            className="mt-3"
            label="Vehicle number"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            placeholder="Optional"
          />
        ) : null}

        <TextInput
          className="mt-3"
          label="Allowed entries"
          value={maxScans}
          onChangeText={setMaxScans}
          keyboardType="number-pad"
          helperText="Use more than 1 for parties / get-togethers (shared pass)"
        />

        {error ? (
          <Text variant="caption" tone="danger" className="mt-3">
            {error}
          </Text>
        ) : null}

        <Button
          className="mt-6"
          label="Create pre-approval"
          fullWidth
          loading={submitting}
          onPress={() => void save()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { Image } from 'expo-image';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
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
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-5 rounded-2xl border border-border bg-card px-4 py-4">
      <Text variant="label" className="mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

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
        <VisitorFlowHeader
          role="resident"
          title="Pre-approve visitor"
          subtitle="Create the pass first. Generate a QR on the next screen to share."
          showBack
        />

        <Button
          className="mb-5"
          label="Import from contacts"
          variant="outline"
          icon={{ family: 'ionic', name: 'people-outline' }}
          fullWidth
          onPress={() => void importContact()}
        />

        <FormSection title="Photo (optional)">
          <Pressable
            onPress={() => void pickPhoto()}
            className="h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-neutral-50 dark:bg-neutral-900"
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
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon
                    family="ionic"
                    name="camera-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text variant="label">
                  {photoHint ? 'Photo recommended' : 'Add photo'}
                </Text>
                <Text variant="caption" tone="muted" className="mt-0.5 text-center">
                  Helps guards verify cab, delivery, or service visitors
                </Text>
              </View>
            )}
          </Pressable>
          {photoUri ? (
            <Pressable
              onPress={() => {
                setPhotoUri(null);
                setPhotoBase64(null);
              }}
              className="mt-3 self-start"
            >
              <Text variant="caption" tone="danger">
                Remove photo
              </Text>
            </Pressable>
          ) : null}
        </FormSection>

        <FormSection title="Visitor">
          <TextInput
            label="Full name"
            value={visitorName}
            onChangeText={setVisitorName}
            autoCapitalize="words"
            placeholder="Visitor name"
          />
          <View className="mt-4">
            <TextInput
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Guest phone"
            />
          </View>
          <View className="mt-4">
            <SelectField
              label="Type"
              value={visitorType}
              onChange={(v) => setVisitorType(v as VisitorType)}
              options={VISITOR_TYPE_OPTIONS}
            />
          </View>
        </FormSection>

        <FormSection title="Vehicle (optional)">
          <SelectField
            label="Vehicle type"
            value={vehicleType}
            onChange={(v) => setVehicleType(v as VehicleType)}
            options={VEHICLE_TYPE_OPTIONS}
          />
          {vehicleType && vehicleType !== 'none' ? (
            <View className="mt-4">
              <TextInput
                label="Vehicle number"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
                placeholder="Optional"
              />
            </View>
          ) : null}
        </FormSection>

        <FormSection title="Pass settings">
          <TextInput
            label="Allowed entries"
            value={maxScans}
            onChangeText={setMaxScans}
            keyboardType="number-pad"
            helperText="Use more than 1 for parties or get-togethers"
          />
        </FormSection>

        {error ? (
          <Text variant="caption" tone="danger" className="mb-3">
            {error}
          </Text>
        ) : null}

        <Button
          label="Create pre-approval"
          fullWidth
          loading={submitting}
          onPress={() => void save()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

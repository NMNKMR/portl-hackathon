import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { VisitorFlowHeader } from '@/components/visitors/visitor-flow-header';
import { useMyMemberships, useSocietyFlats } from '@/hooks/use-society';
import {
  useCreateVisitorRequest,
  useFlatResidentsForGate,
} from '@/hooks/use-visitors';
import { formatFlatLabel } from '@/lib/api/society';
import { uploadVisitorPhoto } from '@/lib/api/visitor-photos';
import { displayPersonName } from '@/lib/format';
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
  const [notifyMembershipId, setNotifyMembershipId] = useState<string | null>(
    null,
  );
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>('none');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const residentsQuery = useFlatResidentsForGate(flatId ?? undefined);

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

  const memberOptions = useMemo(() => {
    return (residentsQuery.data ?? []).map((m) => {
      const name = displayPersonName(m.full_name) || 'Resident';
      const roleHint =
        m.member_type === 'primary'
          ? 'Owner'
          : m.resident_type === 'tenant'
            ? 'Tenant'
            : 'Household';
      return {
        value: m.id,
        label: `${name} · ${roleHint}`,
      };
    });
  }, [residentsQuery.data]);

  useEffect(() => {
    setNotifyMembershipId(null);
  }, [flatId]);

  useEffect(() => {
    const rows = residentsQuery.data ?? [];
    if (!flatId || rows.length === 0) return;
    if (notifyMembershipId && rows.some((r) => r.id === notifyMembershipId)) {
      return;
    }
    const primary = rows.find((r) => r.member_type === 'primary');
    setNotifyMembershipId(primary?.id ?? rows[0]?.id ?? null);
  }, [flatId, residentsQuery.data, notifyMembershipId]);

  const pickPhoto = () => {
    Alert.alert('Visitor photo', 'Choose a source', [
      { text: 'Camera', onPress: () => void takePhoto() },
      { text: 'Photo library', onPress: () => void pickFromLibrary() },
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
    if (!notifyMembershipId) {
      setError('Select which resident to notify');
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
        notifyMembershipId,
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
        <VisitorFlowHeader
          role="guard"
          title="Register visitor"
          subtitle="Capture details at the gate for resident approval."
          showBack
        />

        <FormSection title="Photo (optional)">
          <Pressable
            onPress={pickPhoto}
            className="h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-neutral-50 dark:bg-neutral-900"
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
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon
                    family="ionic"
                    name="camera-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text variant="label">Add photo</Text>
                <Text variant="caption" tone="muted" className="mt-0.5">
                  Camera or library
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
            placeholder="Visitor name"
            autoCapitalize="words"
          />
          <View className="mt-4">
            <SelectField
              label="Visitor type"
              placeholder="Select type"
              value={visitorType}
              options={VISITOR_TYPE_OPTIONS}
              onChange={(value) => setVisitorType(value as VisitorType)}
            />
          </View>
          <View className="mt-4">
            <TextInput
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="Visitor phone"
              keyboardType="phone-pad"
            />
          </View>
        </FormSection>

        <FormSection title="Destination">
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
          {flatId ? (
            <View className="mt-4">
              <SelectField
                label="Notify resident"
                placeholder="Select member"
                value={notifyMembershipId}
                options={memberOptions}
                emptyMessage={
                  residentsQuery.isLoading
                    ? 'Loading members…'
                    : residentsQuery.isError
                      ? residentsQuery.error instanceof Error
                        ? residentsQuery.error.message
                        : 'Could not load members'
                      : 'No approved residents on this flat'
                }
                onChange={setNotifyMembershipId}
              />
              <Text variant="caption" tone="muted" className="mt-1.5">
                Push goes to this person. Defaults to the flat owner.
              </Text>
            </View>
          ) : null}
        </FormSection>

        <FormSection title="Vehicle (optional)">
          <SelectField
            label="Vehicle type"
            placeholder="Select vehicle"
            value={vehicleType}
            options={VEHICLE_TYPE_OPTIONS}
            onChange={(value) => setVehicleType(value as VehicleType)}
          />
          {vehicleType && vehicleType !== 'none' ? (
            <View className="mt-4">
              <TextInput
                label="Vehicle number"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. MH 01 AB 1234"
                autoCapitalize="characters"
              />
            </View>
          ) : null}
        </FormSection>

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

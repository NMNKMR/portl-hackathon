import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import type { BlockType } from '@/types/database';

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'tower', label: 'Tower' },
  { value: 'wing', label: 'Wing' },
  { value: 'block', label: 'Block' },
  { value: 'other', label: 'Other' },
];

type CreateBlockSheetProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; type: BlockType }) => void;
};

export function CreateBlockSheet({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CreateBlockSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [type, setType] = useState<BlockType>('tower');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setType('tower');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError('Enter a block name');
      return;
    }
    setError(null);
    onSubmit({ name: trimmed, type });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0"
      >
        <View
          className="rounded-t-2xl border-t border-border bg-card px-6 pt-5"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Text variant="subtitle">Create block</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Name your tower, wing, or block to organize flats.
          </Text>

          <View className="mt-5">
            <TextInput
              label="Block name"
              placeholder="e.g. Tower A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <Text variant="label" className="mt-4 mb-2">
            Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BLOCK_TYPES.map((item) => {
              const selected = type === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setType(item.value)}
                  className={`rounded-xl border px-3 py-2 ${
                    selected
                      ? 'border-role-admin bg-role-admin/10'
                      : 'border-border bg-background'
                  }`}
                >
                  <Text variant="caption">{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text variant="caption" tone="danger" className="mt-3">
              {error}
            </Text>
          ) : null}

          <Button
            className="mt-6"
            label="Create block"
            fullWidth
            loading={loading}
            onPress={handleSubmit}
          />
          <Button
            className="mt-2"
            label="Cancel"
            variant="ghost"
            fullWidth
            onPress={handleClose}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

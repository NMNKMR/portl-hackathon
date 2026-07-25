import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';

import { AppBottomSheet, BottomSheetFormFields } from '@/components/ui/bottom-sheet';
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
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      title="Create block"
      snapPoints={['55%', '75%']}
      footer={
        <View>
          <Button
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
      }
    >
      <KeyboardAvoidingView behavior="padding">
        <BottomSheetFormFields>
          <Text variant="caption" tone="muted">
            Name your tower, wing, or block to organize flats.
          </Text>

          <TextInput
            label="Block name"
            placeholder="e.g. Tower A"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <View>
            <Text variant="label" className="mb-2">
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
          </View>

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

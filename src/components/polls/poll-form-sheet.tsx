import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';

import {
  AppBottomSheet,
  BottomSheetFormFields,
} from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useCreatePoll } from '@/hooks/use-polls';

type PollFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  societyId: string;
  membershipId: string;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export function PollFormSheet({
  visible,
  onClose,
  societyId,
  membershipId,
}: PollFormSheetProps) {
  const createPoll = useCreatePoll();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [closeDays, setCloseDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuestion('');
    setOptions(['', '']);
    setCloseDays('');
    setError(null);
  }, [visible]);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const submit = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError('Question is required');
      return;
    }
    if (trimmedOptions.length < MIN_OPTIONS) {
      setError(`Add at least ${MIN_OPTIONS} options`);
      return;
    }

    const days = Number.parseInt(closeDays, 10);
    const closesAt =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null;

    setError(null);
    try {
      await createPoll.mutateAsync({
        societyId,
        membershipId,
        question: trimmedQuestion,
        options: trimmedOptions,
        closesAt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create poll');
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Create poll"
      snapPoints={['75%', '92%']}
      footer={
        <View>
          <Button
            label="Create poll"
            fullWidth
            loading={createPoll.isPending}
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
            label="Question"
            value={question}
            onChangeText={setQuestion}
            placeholder="What should residents vote on?"
          />

          {options.map((option, index) => (
            <TextInput
              key={`poll-option-${index}`}
              label={`Option ${index + 1}`}
              value={option}
              onChangeText={(value) => updateOption(index, value)}
              placeholder={`Option ${index + 1}`}
            />
          ))}

          {options.length < MAX_OPTIONS ? (
            <Button
              label="Add option"
              variant="outline"
              size="sm"
              onPress={addOption}
            />
          ) : null}

          <TextInput
            label="Close in (days)"
            value={closeDays}
            onChangeText={setCloseDays}
            keyboardType="number-pad"
            helperText="Leave blank for no auto-close"
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

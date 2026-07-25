import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ScreenBackButton } from "@/components/ui/screen-back-button";
import { Text } from "@/components/ui/text";
import { TextInput } from "@/components/ui/text-input";
import { useCreateSociety } from "@/hooks/use-society";
import { copyTextWithFallback } from "@/lib/clipboard";
import { useThemeColors } from "@/lib/theme-colors";
import type { SocietyPlan } from "@/types/database";

const PLANS: { value: SocietyPlan; label: string; hint: string }[] = [
  { value: "free", label: "Free", hint: "Demo / small societies" },
  { value: "starter", label: "Starter", hint: "Growing buildings" },
  { value: "pro", label: "Pro", hint: "Full features later" },
];

type CreatedSociety = {
  id: string;
  name: string;
  code: string;
};

export default function CreateSocietyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createSociety = useCreateSociety();

  const [name, setName] = useState("");
  const [plan, setPlan] = useState<SocietyPlan>("free");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSociety | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter a society name (at least 2 characters)");
      return;
    }

    try {
      const society = await createSociety.mutateAsync({ name, plan });
      setCreated({
        id: society.id,
        name: society.name,
        code: society.code,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create society");
    }
  };

  const handleGoToDashboard = () => {
    if (!created) return;
    router.replace({
      pathname: "/(admin)",
      params: { societyId: created.id, code: created.code },
    } as Href);
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        >
          {!created ? (
            <ScreenBackButton className="mb-4" />
          ) : (
            <View className="mb-4 h-5" />
          )}

          {!created ? <Text variant="title">Create society</Text> : null}

          {created ? (
            <CreateSuccessView
              society={created}
              onGoToDashboard={handleGoToDashboard}
            />
          ) : (
            <>
              <Text variant="body" tone="muted" className="mt-2">
                You become the admin. We generate a join code you can share.
              </Text>

              <View className="mt-8 gap-4">
                <TextInput
                  label="Society name"
                  placeholder="e.g. Green Park Residency"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="done"
                />

                <View>
                  <Text variant="label" className="mb-2">
                    Plan
                  </Text>
                  <View className="gap-2">
                    {PLANS.map((item) => {
                      const selected = plan === item.value;
                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => setPlan(item.value)}
                          className={`rounded-xl border px-4 py-3 ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card"
                          }`}
                        >
                          <Text variant="label">{item.label}</Text>
                          <Text
                            variant="caption"
                            tone="muted"
                            className="mt-0.5"
                          >
                            {item.hint}
                          </Text>
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

                <Button
                  label="Create society"
                  fullWidth
                  loading={createSociety.isPending}
                  onPress={() => void handleCreate()}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function CreateSuccessView({
  society,
  onGoToDashboard,
}: {
  society: CreatedSociety;
  onGoToDashboard: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center pt-4">
      <View className="relative mb-6 h-24 w-24 items-center justify-center">
        <View className="absolute -left-2 top-2 h-2 w-2 rounded-full bg-accent" />
        <View className="absolute -right-3 top-6 h-2.5 w-2.5 rounded-full bg-primary-light" />
        <View className="absolute bottom-3 -right-2 h-2 w-2 rounded-full bg-accent/80" />
        <View className="absolute left-8 top-2 h-2 w-2 rounded-full bg-warning" />
        <View className="absolute -left-4 bottom-8 h-1.5 w-1.5 rounded-full bg-success" />
        <View className="absolute right-6 -top-2 h-2 w-2 rounded-full bg-primary/60" />
        <View className="absolute left-2 bottom-0 h-1.5 w-1.5 rounded-full bg-danger" />
        <View className="absolute right-3 bottom-1 h-2 w-2 rounded-full bg-primary-dark/80" />

        <View className="h-20 w-20 items-center justify-center rounded-full bg-success">
          <Icon
            family="ionic"
            name="checkmark"
            size={40}
            color={colors.onPrimary}
          />
        </View>
      </View>

      <Text variant="title" align="center">
        Society created!
      </Text>
      <Text variant="body" tone="muted" align="center" className="mt-2">
        You&apos;re the admin.
      </Text>

      <View className="mt-8 w-full rounded-xl border-2 border-dashed border-primary bg-primary/5 px-6 pb-8 pt-4 gap-4 items-center">
        <Text variant="label" tone="muted">
          Society Code
        </Text>
        <Text
          variant="display"
          align="center"
          className="tracking-widest text-primary"
        >
          {society.code}
        </Text>
      </View>

      <View className="mt-4 flex-row items-start gap-2 px-2">
        <Icon
          family="ionic"
          name="information-circle-outline"
          size={18}
          color={colors.muted}
        />
        <Text variant="caption" tone="muted" className="flex-1">
          Share this code with residents so they can join your society.
        </Text>
      </View>

      <View className="mt-8 w-full gap-3">
        <Button
          label="Copy code"
          variant="outline"
          icon={{ family: "ionic", name: "copy-outline" }}
          fullWidth
          onPress={() =>
            void copyTextWithFallback(
              society.code,
              "Join code copied to clipboard",
            )
          }
        />
        <Button
          label="Go to dashboard"
          fullWidth
          onPress={onGoToDashboard}
          icon={{ family: "ionic", name: "chevron-forward-outline" }}
          iconPosition="right"
        />
      </View>
    </View>
  );
}

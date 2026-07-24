import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/use-auth";
import { isValidIndiaMobile } from "@/lib/phone";
import { useThemeColors } from "@/lib/theme-colors";
import { ScrollView } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { signInWithPhone, signInWithGoogle, isLoading } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const busy = isLoading || isSubmitting || isGoogleSubmitting;

  const handleSignIn = async () => {
    setError(null);

    const phoneLocal = phone.replace(/\D/g, "");

    if (!isValidIndiaMobile(phoneLocal)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    if (!password) {
      setError("Enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithPhone(phoneLocal, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <AuthHeader />

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <View className="mt-5 gap-1">
              <Text variant="title">Welcome back!</Text>
              <Text variant="body" tone="muted">
                Sign in to continue to your society
              </Text>
            </View>

            <View className="mt-6 gap-4">
              <View className="gap-1.5">
                <Text variant="label">Mobile Number</Text>
                <View className="h-12 flex-row items-center rounded-xl border border-border bg-card">
                  <Pressable className="h-full flex-row items-center gap-1 border-r border-border px-3">
                    <Text variant="body">🇮🇳</Text>
                    <Text variant="body">+91</Text>
                    <Icon
                      family="ionic"
                      name="chevron-down"
                      size={14}
                      color={colors.muted}
                    />
                  </Pressable>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={10}
                    editable={!busy}
                    className="flex-1 px-3 py-0 text-base text-foreground font-sans"
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text variant="label">Password</Text>
                  <Pressable hitSlop={8}>
                    <Text variant="caption" className="text-primary">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
                <View className="h-12 flex-row items-center rounded-xl border border-border bg-card px-3">
                  <Icon
                    family="feather"
                    name="lock"
                    size={18}
                    color={colors.muted}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    editable={!busy}
                    className="mx-2 flex-1 py-0 text-base text-foreground font-sans"
                  />
                  <Pressable
                    hitSlop={8}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <Icon
                      family="feather"
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              </View>

              {error ? (
                <Text variant="caption" tone="danger">
                  {error}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={handleSignIn}
                className={`mt-1 h-12 flex-row items-center justify-center rounded-xl bg-primary active:opacity-90 ${busy ? "opacity-50" : ""}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text variant="label" tone="inverse">
                    Sign In
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="my-5 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text variant="caption" tone="muted">
                or
              </Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={handleGoogleSignIn}
              className={`h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card active:bg-neutral-100 dark:active:bg-neutral-800 ${busy ? "opacity-50" : ""}`}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Icon
                    family="materialCommunity"
                    name="google"
                    size={20}
                    color={colors.google}
                  />
                  <Text variant="label">Continue with Google</Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="mt-3 flex-row items-center justify-center"
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text variant="caption" tone="muted">
                Don&apos;t have an account?{" "}
              </Text>
              <View className="flex-row items-end">
                <Text variant="label" className="text-accent">
                  Sign up
                </Text>
                <Icon
                  family="feather"
                  name="chevron-right"
                  size={14}
                  color={colors.accent}
                />
              </View>
            </Pressable>

            <View className="mt-6">
              <View className="flex-row rounded-2xl bg-neutral-100 px-3 py-4 dark:bg-neutral-800/50">
                <Feature
                  icon="shield-checkmark"
                  title="Secure"
                  // subtitle="Your data is always protected"
                  color={colors.primary}
                />
                <Feature
                  icon="people"
                  title="Community"
                  // subtitle="Connect with your neighbors"
                  color={colors.primary}
                />
                <Feature
                  icon="notifications"
                  title="Simplified"
                  // subtitle="One app for all society needs"
                  color={colors.primary}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Feature({
  icon,
  title,
  // subtitle,
  color,
}: {
  icon: "shield-checkmark" | "people" | "notifications";
  title: string;
  // subtitle: string;
  color: string;
}) {
  return (
    <View className="flex-1 items-center gap-1 px-1">
      <Icon family="ionic" name={icon} size={22} color={color} />
      <Text variant="caption" className="text-center font-sans-semibold">
        {title}
      </Text>
      {/* <Text
        variant="caption"
        tone="muted"
        align="center"
        className="text-[10px] leading-3"
      >
        {subtitle}
      </Text> */}
    </View>
  );
}

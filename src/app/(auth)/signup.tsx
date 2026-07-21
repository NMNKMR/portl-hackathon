import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
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

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { signUpWithPhone, signInWithGoogle, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const busy = isLoading || isSubmitting || isGoogleSubmitting;

  const handleSignUp = async () => {
    setError(null);

    const trimmedName = fullName.trim();
    const phoneLocal = phone.replace(/\D/g, "");

    if (!trimmedName) {
      setError("Enter your full name");
      return;
    }

    if (!isValidIndiaMobile(phoneLocal)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    if (!password) {
      setError("Create a password");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithPhone({
        fullName: trimmedName,
        phoneLocal,
        password,
        email: email.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
      <View>
        <AuthHeader />
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
          style={{ top: insets.top + 8 }}
        >
          <Icon
            family="ionic"
            name="arrow-back"
            size={18}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={"padding"}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-6 gap-1">
            <Text variant="title">Create account</Text>
            <Text variant="body" tone="muted">
              Get started with your society in minutes.
            </Text>
          </View>

          <View className="mt-6 gap-4">
            <View className="gap-1.5">
              <Text variant="label">Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Priya Sharma"
                placeholderTextColor={colors.placeholder}
                autoComplete="name"
                textContentType="name"
                editable={!busy}
                className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground font-sans"
              />
            </View>

            <View className="gap-1.5">
              <Text variant="label">Mobile Number</Text>
              <View className="h-12 flex-row items-center rounded-xl border border-border bg-card">
                <View className="h-full flex-row items-center gap-1 border-r border-border px-3">
                  <Text variant="body">🇮🇳</Text>
                  <Text variant="body">+91</Text>
                </View>
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
              <Text variant="label">
                Email{" "}
                <Text variant="caption" tone="muted">
                  (optional)
                </Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!busy}
                className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground font-sans"
              />
            </View>

            <View className="gap-1.5">
              <Text variant="label">Password</Text>
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
                  placeholder="Create a password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
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
              onPress={handleSignUp}
              className={`mt-1 h-12 flex-row items-center justify-center rounded-xl bg-primary active:opacity-90 ${busy ? "opacity-50" : ""}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text variant="label" tone="inverse">
                  Sign Up
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            className="mt-5 flex-row items-center justify-center"
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text variant="body" tone="muted">
              Already have an account?{" "}
            </Text>
            <View className="flex-row items-center">
              <Text variant="label" className="text-accent">
                Sign in
              </Text>
              <Icon
                family="feather"
                name="chevron-right"
                size={14}
                color={colors.accent}
              />
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

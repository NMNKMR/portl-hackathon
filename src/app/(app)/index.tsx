import { useLocalSearchParams, useRouter, useSegments, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyIllustration } from "@/components/ui/empty-illustration";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/use-auth";
import { useMyMemberships } from "@/hooks/use-society";
import { type MembershipWithSociety } from "@/lib/api/society";
import {
  displayPersonName,
  formatJoinDate,
  membershipSummaryLine,
} from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";
import { useThemeColors } from "@/lib/theme-colors";

const noSocietyImage = require("../../../assets/images/no-society.png");
const waitingImage = require("../../../assets/images/waiting-screen.png");

function roleHome(membership: MembershipWithSociety): Href {
  const societyId = membership.society_id;
  if (membership.role === "admin") {
    return {
      pathname: "/(admin)",
      params: { societyId },
    } as Href;
  }
  if (membership.role === "guard") {
    return {
      pathname: "/(guard)",
      params: { societyId },
    } as Href;
  }
  return {
    pathname: "/(resident)",
    params: { societyId },
  } as Href;
}

function HubGreeting() {
  const { profile, user } = useAuth();
  const colors = useThemeColors();
  const name = displayPersonName(profile?.full_name, "there");

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon
          family="ionic"
          name="person-outline"
          size={22}
          color={colors.primary}
        />
      </View>
      <View className="flex-1">
        <Text variant="subtitle">Hi, {name}</Text>
        <Text variant="caption" tone="muted" className="mt-0.5">
          {formatPhoneDisplay(profile?.phone ?? user?.phone)}
        </Text>
      </View>
    </View>
  );
}

function HubSignOutChip() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      disabled={signingOut}
      onPress={() => {
        void (async () => {
          setSigningOut(true);
          try {
            await signOut();
            router.replace("/(auth)/login" as Href);
          } finally {
            setSigningOut(false);
          }
        })();
      }}
      className="h-9 flex-row items-center gap-1.5 rounded-lg border border-border px-3 active:bg-neutral-100 dark:active:bg-neutral-800"
    >
      {signingOut ? (
        <ActivityIndicator size="small" color={colors.danger} />
      ) : (
        <>
          <Icon
            family="ionic"
            name="log-out-outline"
            size={16}
            color={colors.danger}
          />
          <Text variant="caption" className="text-danger">
            Sign out
          </Text>
        </>
      )}
    </Pressable>
  );
}

function HubBrandRow() {
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Image
          source={require("../../../assets/icons/portl-logo.png")}
          className="h-6 w-6"
        />
        <Text variant="title" className="text-primary">
          Portl
        </Text>
      </View>
      <HubSignOutChip />
    </View>
  );
}

type HubBodyProps = {
  approved: MembershipWithSociety[];
  pending: MembershipWithSociety[];
  rejected: MembershipWithSociety[];
  isEmpty: boolean;
  pendingOnly: boolean;
};

function HubBody({
  approved,
  pending,
  rejected,
  isEmpty,
  pendingOnly,
}: HubBodyProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const primaryPending = pending[0] ?? null;

  if (isEmpty) {
    return (
      <>
        <EmptyIllustration source={noSocietyImage} className="mt-2" />
        <View className="self-center items-center justify-center border border-primary rounded-full p-4">
          <Icon
            family="ionic"
            name="business-outline"
            size={32}
            color={colors.primary}
          />
        </View>
        <Text variant="title" align="center" className="mt-2">
          You&apos;re not in a society yet
        </Text>
        <Text variant="body" tone="muted" align="center" className="mt-2">
          Create a new society or join an existing one with a code from your
          admin.
        </Text>
        <View className="mt-8 gap-3">
          <Button
            label="Create society"
            fullWidth
            icon={{ family: "ionic", name: "add-circle-outline" }}
            onPress={() => router.push("/(app)/create-society")}
          />
          <Button
            label="Join with code"
            variant="outline"
            fullWidth
            icon={{ family: "ionic", name: "qr-code-outline" }}
            onPress={() => router.push("/(app)/join-society")}
          />
        </View>
      </>
    );
  }

  if (pendingOnly && primaryPending) {
    const requestedAt = formatJoinDate(primaryPending.created_at);

    return (
      <>
        <EmptyIllustration source={waitingImage} className="mt-2" />
        <Text variant="title" align="center" className="mt-2">
          Waiting for approval
        </Text>
        <Text variant="body" tone="muted" align="center" className="mt-2">
          Your request has been submitted.
        </Text>

        <View className="mt-8 rounded-xl border border-border bg-card px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon
                family="ionic"
                name="business-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View className="flex-1 gap-1">
              <Text variant="label">
                {primaryPending.societies?.name ?? "Society"}
              </Text>
              <Text variant="caption" tone="muted">
                {membershipSummaryLine(primaryPending)}
              </Text>
              {requestedAt ? (
                <Text variant="caption" tone="muted" className="mt-1">
                  Requested {requestedAt}
                </Text>
              ) : null}
              <Badge tone="pending" label="Pending" className="mt-2" />
            </View>
          </View>
        </View>

        {pending.length > 1 ? (
          <View className="mt-4 gap-2">
            <Text variant="label">Other pending requests</Text>
            {pending.slice(1).map((m) => (
              <View
                key={m.id}
                className="rounded-xl border border-border bg-card px-4 py-3"
              >
                <Text variant="label">{m.societies?.name ?? "Society"}</Text>
                <Text variant="caption" tone="muted" className="mt-0.5">
                  {membershipSummaryLine(m)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-6 flex-row items-start gap-2 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
          <Icon
            family="ionic"
            name="time-outline"
            size={18}
            color={colors.muted}
          />
          <Text variant="caption" tone="muted" className="flex-1">
            {primaryPending.member_type === "household"
              ? "The primary resident of this flat will review your request."
              : "The society admin will review your request."}
          </Text>
        </View>

        <View className="mt-8">
          <Button
            label="Join another society"
            variant="outline"
            fullWidth
            onPress={() => router.push("/(app)/join-society")}
          />
        </View>
      </>
    );
  }

  return (
    <>
      {approved.length > 0 ? (
        <View className="mt-4 gap-3">
          <Text variant="label">Your societies</Text>
          {approved.map((m) => (
            <Pressable
              key={m.id}
              className="rounded-xl border border-border bg-card px-4 py-3"
              onPress={() => router.push(roleHome(m))}
            >
              <Text variant="label">{m.societies?.name ?? "Society"}</Text>
              <Text
                variant="caption"
                tone="muted"
                className="mt-0.5 capitalize"
              >
                {membershipSummaryLine(m)}
                {m.societies?.code ? ` · ${m.societies.code}` : ""}
              </Text>
              {m.role === "admin" ? (
                <Text variant="caption" tone="primary" className="mt-2">
                  Open dashboard to approve join requests
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {pending.length > 0 && !pendingOnly ? (
        <View className="mt-8 gap-3">
          <Text variant="label">Waiting for approval</Text>
          {pending.map((m) => (
            <View
              key={m.id}
              className="rounded-xl border border-accent/40 bg-card px-4 py-3"
            >
              <Text variant="label">{m.societies?.name ?? "Society"}</Text>
              <Text variant="caption" tone="muted" className="mt-1">
                {membershipSummaryLine(m)}
              </Text>
              <Badge tone="pending" label="Pending" className="mt-2" />
            </View>
          ))}
        </View>
      ) : null}

      {rejected.length > 0 ? (
        <View className="mt-8 gap-3">
          <Text variant="label">Declined</Text>
          {rejected.map((m) => (
            <View
              key={m.id}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <Text variant="label">{m.societies?.name ?? "Society"}</Text>
              <Text variant="caption" tone="muted" className="mt-0.5">
                Your request was rejected. You can join again with a code.
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-8 gap-3">
        <Button
          label="Create another society"
          variant="outline"
          fullWidth
          onPress={() => router.push("/(app)/create-society")}
        />
        <Button
          label="Join another society"
          variant="ghost"
          fullWidth
          onPress={() => router.push("/(app)/join-society")}
        />
      </View>
    </>
  );
}

export default function AppHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams<{ manage?: string }>();
  const colors = useThemeColors();
  const membershipsQuery = useMyMemberships();
  const forceHubView =
    params.manage === "1" || params.manage === "true";

  const memberships = membershipsQuery.data ?? [];
  const approved = useMemo(
    () => memberships.filter((m) => m.status === "approved"),
    [memberships],
  );
  const pending = useMemo(
    () => memberships.filter((m) => m.status === "pending"),
    [memberships],
  );
  const rejected = useMemo(
    () => memberships.filter((m) => m.status === "rejected"),
    [memberships],
  );

  const isEmpty =
    approved.length === 0 && pending.length === 0 && rejected.length === 0;
  const pendingOnly = pending.length > 0 && approved.length === 0;

  // Creating a society invalidates memberships; don't yank away from the code success screen.
  const onCreateSocietyFlow = (segments as string[]).includes("create-society");
  const primaryApproved =
    approved.find((m) => m.role === "admin") ?? approved[0] ?? null;
  const shouldAutoRedirect =
    !forceHubView &&
    !membershipsQuery.isLoading &&
    !membershipsQuery.isError &&
    Boolean(primaryApproved) &&
    !onCreateSocietyFlow;

  useEffect(() => {
    if (shouldAutoRedirect && primaryApproved) {
      router.replace(roleHome(primaryApproved));
    }
  }, [shouldAutoRedirect, primaryApproved, router]);

  if (membershipsQuery.isLoading || shouldAutoRedirect) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={membershipsQuery.isRefetching}
            onRefresh={() => void membershipsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <HubBrandRow />
        <HubGreeting />

        {membershipsQuery.isError ? (
          <Text variant="caption" tone="danger" className="mt-4">
            {membershipsQuery.error instanceof Error
              ? membershipsQuery.error.message
              : "Could not load memberships"}
          </Text>
        ) : null}

        <View className="mt-8">
          <HubBody
            approved={approved}
            pending={pending}
            rejected={rejected}
            isEmpty={isEmpty}
            pendingOnly={pendingOnly}
          />
        </View>
      </ScrollView>
    </View>
  );
}

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { imageExtFromUri, uploadLocalImage } from "@/lib/api/upload-local-image";
import { toE164India } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export async function fetchProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function signInWithPhonePassword(
  phoneLocal: string,
  password: string,
) {
  const phone = toE164India(phoneLocal);
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithPhonePassword(input: {
  fullName: string;
  phoneLocal: string;
  password: string;
  email?: string;
}) {
  const phone = toE164India(input.phoneLocal);
  const email = input.email?.trim() || undefined;
  const password = input.password;

  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        ...(email ? { email } : {}),
        phone,
      },
      ...(email ? { emailRedirectTo: undefined } : {}),
    },
  });

  if (error) throw error;

  // If Auth created the user but email was provided separately, try linking later.
  // Profile phone is filled by handle_new_user trigger from auth.users.phone.
  if (email && data.user) {
    await supabase.auth.updateUser({ email }).catch(() => undefined);
  }

  return data;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No Google auth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in was cancelled");
  }

  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.replace(/^#/, "") || url.search);

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (!access_token || !refresh_token) {
    // PKCE code flow
    const code =
      params.get("code") ?? new URL(result.url).searchParams.get("code");
    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }
    throw new Error("Google sign-in did not return a session");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}

export async function updateUserPhone(phoneLocal: string) {
  const phone = toE164India(phoneLocal);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Not signed in");

  const { error: authError } = await supabase.auth.updateUser({ phone });
  if (authError) throw authError;

  const { error: profileError } = await supabase
    .from("users")
    .update({ phone })
    .eq("id", user.id);

  if (profileError) throw profileError;
}

export async function updateProfile(input: {
  fullName?: string;
  avatarUrl?: string | null;
}): Promise<UserProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Not signed in");

  const patch: { full_name?: string; avatar_url?: string | null } = {};
  if (input.fullName !== undefined) {
    const trimmed = input.fullName.trim();
    if (trimmed.length < 1) throw new Error("Name is required");
    patch.full_name = trimmed;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }

  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", user.id)
    .select("id, full_name, phone, avatar_url")
    .single();

  if (error) throw error;
  return data;
}

/** Upload avatar to public `avatars` bucket; path `{userId}/{timestamp}.ext`. */
export async function uploadAvatar(input: {
  localUri: string;
  base64?: string | null;
}): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Not signed in");

  const ext = imageExtFromUri(input.localUri);
  const path = `${user.id}/${Date.now()}.${ext}`;

  return uploadLocalImage({
    bucket: "avatars",
    path,
    localUri: input.localUri,
    base64: input.base64,
    upsert: true,
  });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    const { error: localError } = await supabase.auth.signOut({
      scope: 'local',
    });
    if (localError) throw localError;
  }
}

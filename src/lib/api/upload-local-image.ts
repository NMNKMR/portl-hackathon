import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0] ?? uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  const ext = match?.[1]?.toLowerCase();
  if (ext === 'png' || ext === 'webp' || ext === 'jpg' || ext === 'jpeg') {
    return ext === 'jpg' ? 'jpeg' : ext;
  }
  return 'jpeg';
}

function contentTypeForExt(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Upload a local device image to Supabase Storage.
 * Uses ArrayBuffer from base64 (RN-safe) — Blob/fetch(fileUri) often throws
 * "Network request failed" on React Native.
 */
export async function uploadLocalImage(input: {
  bucket: string;
  path: string;
  localUri: string;
  /** Prefer ImagePicker `base64` when available — skips FileSystem read. */
  base64?: string | null;
  contentType?: string;
  upsert?: boolean;
}): Promise<string> {
  const ext = extensionFromUri(input.localUri);
  const contentType = input.contentType ?? contentTypeForExt(ext);

  let base64 = input.base64?.trim() || null;
  if (!base64) {
    base64 = await FileSystem.readAsStringAsync(input.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const { error: uploadError } = await supabase.storage
    .from(input.bucket)
    .upload(input.path, decode(base64), {
      contentType,
      upsert: input.upsert ?? false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(input.bucket).getPublicUrl(input.path);
  return data.publicUrl;
}

export function imageExtFromUri(uri: string): string {
  const ext = extensionFromUri(uri);
  return ext === 'jpeg' ? 'jpg' : ext;
}

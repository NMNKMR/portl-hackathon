import { imageExtFromUri, uploadLocalImage } from '@/lib/api/upload-local-image';
import { supabase } from '@/lib/supabase';

const BUCKET = 'visitor-photos';

/** Upload a notice image to the public visitor-photos bucket; returns public URL. */
export async function uploadNoticePhoto(input: {
  societyId: string;
  localUri: string;
  base64?: string | null;
}): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Not signed in');

  const ext = imageExtFromUri(input.localUri);
  const path = `${input.societyId}/notices/${user.id}/${Date.now()}.${ext}`;

  return uploadLocalImage({
    bucket: BUCKET,
    path,
    localUri: input.localUri,
    base64: input.base64,
    upsert: false,
  });
}

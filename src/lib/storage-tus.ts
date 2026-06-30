import * as tus from 'tus-js-client';
import { createClient } from '@/utils/supabase/client';

const CHUNK_SIZE = 6 * 1024 * 1024;
export const RESUMABLE_UPLOAD_THRESHOLD = CHUNK_SIZE;

function getResumableEndpoint() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL is not configured.');
  const projectRef = new URL(url).hostname.split('.')[0];
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

export function shouldUseResumableUpload(file: Blob, kind: string) {
  return kind === 'video' || file.size > RESUMABLE_UPLOAD_THRESHOLD;
}

export async function uploadViaTus(
  file: Blob,
  payload: {
    bucket: string;
    path: string;
    token?: string;
    contentType: string;
  },
  onProgress?: (percent: number) => void
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Supabase anon key is not configured.');
  }

  const headers: Record<string, string> = {
    apikey: anonKey,
    'x-upsert': 'true',
  };

  if (session?.access_token) {
    headers.authorization = `Bearer ${session.access_token}`;
  }

  if (payload.token) {
    headers['x-signature'] = payload.token;
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: getResumableEndpoint(),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: payload.bucket,
        objectName: payload.path,
        contentType: payload.contentType,
        cacheControl: '3600',
      },
      chunkSize: CHUNK_SIZE,
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (onProgress && bytesTotal > 0) {
          onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
        }
      },
      onSuccess: () => resolve(),
    });

    upload
      .findPreviousUploads()
      .then((previous) => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      })
      .catch(reject);
  });
}

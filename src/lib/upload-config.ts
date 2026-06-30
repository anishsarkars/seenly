export const UPLOAD_BUCKETS = {
  video: 'videos',
  thumbnail: 'thumbnails',
  resume: 'resumes',
  avatar: 'avatars',
} as const;

export type UploadKind = keyof typeof UPLOAD_BUCKETS;

export type UploadFileMeta = {
  name: string;
  type: string;
};

export function pathFor(kind: UploadKind, userId: string, file: UploadFileMeta) {
  switch (kind) {
    case 'video': {
      const ext =
        file.type.includes('webm') || file.name.endsWith('.webm') ? 'webm' : 'mp4';
      return `${userId}/intro.${ext}`;
    }
    case 'thumbnail':
      return `${userId}/poster.jpg`;
    case 'resume':
      return `${userId}/resume.pdf`;
    case 'avatar':
      return `${userId}/avatar.jpg`;
  }
}

export function contentTypeFor(kind: UploadKind, file: UploadFileMeta) {
  if (file.type) return file.type;
  switch (kind) {
    case 'video':
      return file.name.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    case 'thumbnail':
      return 'image/jpeg';
    case 'resume':
      return 'application/pdf';
    case 'avatar':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

export function publicUrlFor(bucket: string, path: string, supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
}

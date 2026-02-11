import imageCompression from "browser-image-compression";

const DEFAULT_OPTIONS = {
  maxWidthOrHeight: 1024,
  maxSizeMB: 0.3,
  useWebWorker: true,
  fileType: undefined as undefined | "image/jpeg" | "image/png" | "image/webp",
};

export type CompressImageOptions = Partial<typeof DEFAULT_OPTIONS>;

/**
 * 업로드 전 이미지 리사이징·압축 (프론트엔드).
 * - maxWidthOrHeight: 1024px
 * - maxSizeMB: 0.3MB (300KB 이하 목표)
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return imageCompression(file, {
    maxWidthOrHeight: opts.maxWidthOrHeight,
    maxSizeMB: opts.maxSizeMB,
    useWebWorker: opts.useWebWorker,
    fileType: opts.fileType,
  });
}

import { MAX_IMAGE_BYTES, MAX_IMAGE_ERROR_MESSAGE } from "@/lib/constants";

/** 이미지 파일 크기 검사. 문제 없으면 null, 있으면 에러 메시지 반환 */
export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) return MAX_IMAGE_ERROR_MESSAGE;
  return null;
}

type UploadResult = { url: string } | { error: string };
type UploadFn = (formData: FormData) => Promise<UploadResult>;

/** 크기 검사 후 업로드 실행. 실패 시 { error }, 성공 시 { url } 반환 */
export async function uploadImageWithValidation(
  file: File,
  upload: UploadFn
): Promise<UploadResult> {
  const sizeError = validateImageFile(file);
  if (sizeError) return { error: sizeError };
  const formData = new FormData();
  formData.append("file", file);
  return upload(formData);
}

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useAuthState } from "@/lib/hooks/use-auth-state";
import { queryKeys } from "@/lib/query-keys";
import { compressImage } from "@/lib/utils/image-compression";
import {
  fetchShopComments,
  addShopComment,
  uploadCommentImage,
  type ShopCommentRow,
} from "@/app/actions/shop";
import { MessageSquare, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShopFeedCommentsProps {
  shopId: number;
}

function ImageViewerModal({
  src,
  open,
  onOpenChange,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-auto p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>이미지 보기</DialogTitle>
        </DialogHeader>
        <div className="relative w-full min-h-[200px] flex items-center justify-center">
          <Image
            src={src}
            alt="제보 이미지"
            width={800}
            height={600}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentItem({
  comment,
  onImageClick,
}: {
  comment: ShopCommentRow;
  onImageClick: (url: string) => void;
}) {
  return (
    <li className="flex gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span className="font-medium text-foreground">{comment.authorName}</span>
          <span>{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap wrap-break-word">{comment.content}</p>
        {comment.imageUrl && (
          <button
            type="button"
            onClick={() => onImageClick(comment.imageUrl!)}
            className="mt-2 block relative w-20 h-20 rounded overflow-hidden border border-border hover:opacity-90 transition-opacity"
          >
            <Image
              src={comment.imageUrl}
              alt="제보 사진"
              fill
              className="object-cover"
              unoptimized
              sizes="80px"
            />
          </button>
        )}
      </div>
    </li>
  );
}

export function ShopFeedComments({ shopId }: ShopFeedCommentsProps) {
  const queryClient = useQueryClient();
  const { data: authData } = useAuthState();
  const isLoggedIn = !!authData?.user;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: queryKeys.shopComments(shopId),
    queryFn: () => fetchShopComments(shopId),
  });

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("로그인 후 제보할 수 있습니다.");
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const formData = new FormData();
        formData.set("file", compressed);
        const uploadResult = await uploadCommentImage(formData);
        if ("error" in uploadResult) {
          toast.error(uploadResult.error);
          setSubmitting(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      const result = await addShopComment(shopId, trimmed, imageUrl);
      if (!result.success) {
        toast.error(result.error ?? "제보에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      toast.success("현황이 제보되었습니다.");
      setContent("");
      handleRemoveImage();
      await queryClient.invalidateQueries({ queryKey: queryKeys.shopComments(shopId) });
    } catch (err) {
      console.error("handleSubmit:", err);
      toast.error("제보 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="size-4" />
        현황 제보
      </h3>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="재고, 품절 여부 등 현황을 알려주세요 (사진 첨부 가능)"
            className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            maxLength={500}
            disabled={submitting}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              <ImagePlus className="size-4 mr-1" />
              사진 첨부
            </Button>
            {imagePreview && (
              <div className="relative inline-block">
                <div className="relative w-14 h-14 rounded border overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="미리보기"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                  aria-label="첨부 취소"
                >
                  ×
                </button>
              </div>
            )}
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "제보하기"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          로그인하면 현황을 제보할 수 있습니다.
        </p>
      )}

      <ul className="space-y-2 max-h-[240px] overflow-y-auto">
        {isLoading ? (
          <li className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </li>
        ) : comments.length === 0 ? (
          <li className="text-sm text-muted-foreground py-4 text-center">
            아직 제보가 없습니다.
          </li>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onImageClick={setViewerImage}
            />
          ))
        )}
      </ul>

      <ImageViewerModal
        src={viewerImage ?? ""}
        open={!!viewerImage}
        onOpenChange={(open) => !open && setViewerImage(null)}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { queryKeys } from "@/lib/query-keys";
import { updateMyName } from "@/app/actions/owner";
import { toast } from "sonner";
import { User, MessageSquare, Loader2, MapPin, ArrowLeft } from "lucide-react";
import type { MyCommentRow } from "@/lib/supabase/queries";

interface MypageClientProps {
  initialProfile: { id: number; name: string; email: string };
  initialMyComments: MyCommentRow[];
}

function ImageViewer({
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

export function MypageClient({
  initialProfile,
  initialMyComments,
}: MypageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialProfile.name);
  const [saving, setSaving] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    setName(initialProfile.name);
  }, [initialProfile.name]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed === initialProfile.name) {
      toast.info("변경된 내용이 없습니다.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateMyName(trimmed);
      if (!result.success) {
        toast.error(result.error ?? "저장에 실패했습니다.");
        return;
      }
      toast.success("이름이 변경되었습니다.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.authState });
      await queryClient.invalidateQueries({ queryKey: ["shopComments"] });
      router.refresh();
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="홈으로">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">마이페이지</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* 프로필 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <User className="size-4" />
            내 정보
          </h2>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{initialProfile.email}</p>
            <form onSubmit={handleSaveName} className="space-y-3">
              <Label htmlFor="mypage-name">표시 이름 (닉네임)</Label>
              <div className="flex gap-2">
                <Input
                  id="mypage-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  maxLength={50}
                  className="flex-1"
                  disabled={saving}
                />
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "저장"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* 내가 남긴 현황 제보 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="size-4" />
            내가 남긴 현황 제보
          </h2>
          {initialMyComments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border bg-muted/30">
              아직 남긴 제보가 없습니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {initialMyComments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/?shopId=${c.shopId}`}
                      className="font-medium text-foreground hover:underline flex items-center gap-1"
                    >
                      <MapPin className="size-4 shrink-0" />
                      {c.shopName}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap wrap-break-word">
                    {c.content}
                  </p>
                  {c.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setViewerImage(c.imageUrl!)}
                      className="block relative w-20 h-20 rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={c.imageUrl}
                        alt="제보 사진"
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="80px"
                      />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <ImageViewer
        src={viewerImage ?? ""}
        open={!!viewerImage}
        onOpenChange={(open) => !open && setViewerImage(null)}
      />
    </div>
  );
}

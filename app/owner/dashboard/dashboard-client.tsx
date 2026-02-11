"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useFieldArray,
  Controller,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GachaMachine, KujiStatus, Shop } from "@/types/shop";
import {
  updateShopPromo,
  upsertGachaMachines,
  upsertKujiStatuses,
} from "@/app/actions/shop";
import { uploadShopImage } from "@/app/actions/owner";
import { queryKeys } from "@/lib/query-keys";
import { uploadImageWithValidation } from "@/lib/utils/upload-image";
import { toast } from "sonner";
import { Minus, Plus, Save, ImagePlus, ImageOff, PlusCircle, Store, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";

const DEFAULT_GRADES = ["A상", "B상", "C상", "D상", "라스트원"];

const gachaFormSchema = z.object({
  series: z.string().min(1, "시리즈명을 입력해주세요"),
  stock: z
    .union([z.number(), z.string()])
    .transform((v) => Math.max(0, Number(v) || 0)),
  imageUrl: z.string().optional(),
});

const kujiGradeSchema = z.object({
  grade: z.string(),
  count: z
    .union([z.number(), z.string()])
    .transform((v) => Math.max(0, Number(v) || 0)),
});

const kujiFormSchema = z.object({
  name: z.string().min(1, "복권명을 입력해주세요"),
  imageUrl: z.string().optional(),
  grades: z
    .array(kujiGradeSchema)
    .refine(
      (grades) => grades.some((g) => g.grade.trim()),
      "등급을 하나 이상 입력해주세요",
    ),
});

type GachaFormValues = z.output<typeof gachaFormSchema>;
type KujiFormValues = z.output<typeof kujiFormSchema>;

interface DashboardClientProps {
  initialShop: Shop | null;
}

export function DashboardClient({ initialShop }: DashboardClientProps) {
  const queryClient = useQueryClient();
  const ownerShop = initialShop;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopName, setShopName] = useState(ownerShop?.name ?? "");
  const [promotionalText, setPromotionalText] = useState(
    ownerShop?.promotionalText ??
      "이곳은 체험용 매장입니다. 자유롭게 테스트해보세요!",
  );
  const [representativeImage, setRepresentativeImage] = useState<string | null>(
    ownerShop?.representativeImageUrl ?? null,
  );
  const [businessHours, setBusinessHours] = useState(
    ownerShop?.businessHours ?? "10:00 - 21:00",
  );
  const [closedDays, setClosedDays] = useState(ownerShop?.closedDays ?? "");
  const [gachaMachines, setGachaMachines] = useState<GachaMachine[]>(
    ownerShop?.gachaMachines ?? [],
  );
  const [kujiStatuses, setKujiStatuses] = useState<KujiStatus[]>(
    ownerShop?.kujiStatuses ?? [],
  );
  const [gachaStocks, setGachaStocks] = useState<Record<number, number>>(
    () =>
      Object.fromEntries(
        (ownerShop?.gachaMachines ?? []).map((m) => [m.id, m.stock ?? 0]),
      ) as Record<number, number>,
  );
  const [kujiGrades, setKujiGrades] = useState<
    Record<number, { grade: string; count: number }[]>
  >(
    () =>
      Object.fromEntries(
        (ownerShop?.kujiStatuses ?? []).map((s) => [
          s.id,
          s.gradeStatus ?? DEFAULT_GRADES.map((g) => ({ grade: g, count: 0 })),
        ]),
      ) as Record<number, { grade: string; count: number }[]>,
  );
  const [lastUpdated, setLastUpdated] = useState(
    () =>
      (ownerShop?.lastUpdatedAt && formatRelativeTime(ownerShop.lastUpdatedAt) + " 업데이트") ||
      "업데이트 정보 없음"
  );
  const [saving, setSaving] = useState(false);

  const [addGachaOpen, setAddGachaOpen] = useState(false);
  const [addKujiOpen, setAddKujiOpen] = useState(false);
  const [editingGachaImageId, setEditingGachaImageId] = useState<number | null>(null);
  const [editingKujiImageId, setEditingKujiImageId] = useState<number | null>(null);
  const newGachaImageInputRef = useRef<HTMLInputElement>(null);
  const newKujiImageInputRef = useRef<HTMLInputElement>(null);
  const existingGachaImageRef = useRef<HTMLInputElement>(null);
  const existingKujiImageRef = useRef<HTMLInputElement>(null);

  const gachaForm = useForm<GachaFormValues>({
    resolver: zodResolver(gachaFormSchema) as Resolver<GachaFormValues>,
    defaultValues: { series: "", stock: 0, imageUrl: "" },
  });

  const kujiForm = useForm<KujiFormValues>({
    resolver: zodResolver(kujiFormSchema) as Resolver<KujiFormValues>,
    defaultValues: {
      name: "",
      imageUrl: "",
      grades: DEFAULT_GRADES.map((g) => ({ grade: g, count: 0 })),
    },
  });

  const kujiGradesField = useFieldArray({
    control: kujiForm.control,
    name: "grades",
  });

  const watchedKujiGrades = useWatch({
    control: kujiForm.control,
    name: "grades",
    defaultValue: [],
  });

  const handleSavePromo = async () => {
    if (!ownerShop) return;
    if (!shopName.trim()) {
      toast.error("매장 이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    // http/https URL만 저장 (blob URL은 업로드 후 대체됨)
    const imageUrl =
      representativeImage === null
        ? null
        : representativeImage?.startsWith("http")
          ? representativeImage
          : ownerShop.representativeImageUrl ?? undefined;
    const result = await updateShopPromo(ownerShop.id, {
      name: shopName.trim(),
      promotionalText,
      representativeImageUrl: imageUrl,
      businessHours,
      closedDays: closedDays || undefined,
    });
    setSaving(false);
    if (result.success) {
      setLastUpdated("방금 업데이트");
      await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
      toast.success("매장 정보가 저장되었습니다.");
    } else {
      toast.error(`저장 실패: ${result.error}`);
    }
  };

  const handleSaveStock = async () => {
    if (!ownerShop) return;
    setSaving(true);
    const gachaWithStock: GachaMachine[] = gachaMachines.map((m) => ({
      ...m,
      stock: gachaStocks[m.id] ?? m.stock ?? 0,
    }));
    const kujiWithGrades: KujiStatus[] = kujiStatuses.map((s) => ({
      ...s,
      gradeStatus: kujiGrades[s.id] ?? s.gradeStatus ?? [],
      stock: (kujiGrades[s.id] ?? s.gradeStatus ?? []).reduce(
        (sum, g) => sum + g.count,
        0,
      ),
    }));

    const [gachaResult, kujiResult] = await Promise.all([
      upsertGachaMachines(ownerShop.id, gachaWithStock),
      upsertKujiStatuses(ownerShop.id, kujiWithGrades),
    ]);
    setSaving(false);

    if (gachaResult.success && kujiResult.success) {
      setLastUpdated("방금 업데이트");
      await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
      toast.success("재고가 저장되었습니다.");
    } else {
      toast.error(
        `저장 실패: ${gachaResult.success ? "" : gachaResult.error} ${kujiResult.success ? "" : kujiResult.error}`,
      );
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    const result = await uploadImageWithValidation(file, uploadShopImage);
    e.target.value = "";
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setRepresentativeImage(result.url);
  };

  const handleGachaImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingGachaImageId == null) {
      e.target.value = "";
      return;
    }
    const result = await uploadImageWithValidation(file, uploadShopImage);
    e.target.value = "";
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setGachaMachines((prev) =>
      prev.map((m) =>
        m.id === editingGachaImageId ? { ...m, imageUrl: result.url } : m,
      ),
    );
    setEditingGachaImageId(null);
  };

  const handleKujiImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingKujiImageId == null) {
      e.target.value = "";
      return;
    }
    const result = await uploadImageWithValidation(file, uploadShopImage);
    e.target.value = "";
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setKujiStatuses((prev) =>
      prev.map((s) =>
        s.id === editingKujiImageId ? { ...s, imageUrl: result.url } : s,
      ),
    );
    setEditingKujiImageId(null);
  };

  const updateGachaStock = (id: number, delta: number) => {
    setGachaStocks((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const updateKujiGrade = (
    kujiId: number,
    gradeIndex: number,
    delta: number,
  ) => {
    setKujiGrades((prev) => {
      const grades = [...(prev[kujiId] ?? [])];
      const current = grades[gradeIndex];
      grades[gradeIndex] = {
        grade: current?.grade ?? "",
        count: Math.max(0, (current?.count ?? 0) + delta),
      };
      return { ...prev, [kujiId]: grades };
    });
  };

  const onAddGacha = (data: GachaFormValues) => {
    const newId = Math.max(0, ...gachaMachines.map((m) => m.id)) + 1;
    setGachaMachines((prev) => [
      ...prev,
      {
        id: newId,
        name: `캡슐토이 ${newId}`,
        series: data.series.trim(),
        stock: data.stock,
        imageUrl: data.imageUrl || undefined,
      },
    ]);
    setGachaStocks((prev) => ({ ...prev, [newId]: data.stock }));
    gachaForm.reset({ series: "", stock: 0, imageUrl: "" });
    setAddGachaOpen(false);
  };

  const onAddKuji = (data: KujiFormValues) => {
    const validGrades = data.grades.filter((g) => g.grade.trim());
    const newId = Math.max(0, ...kujiStatuses.map((s) => s.id)) + 1;
    const totalCount = validGrades.reduce((sum, g) => sum + g.count, 0);
    const gradesWithCount = validGrades.filter((g) => g.count > 0);
    const gradeStatus =
      gradesWithCount.length > 0 ? gradesWithCount : validGrades;
    setKujiStatuses((prev) => [
      ...prev,
      {
        id: newId,
        name: data.name.trim(),
        status: totalCount <= 1 ? "라스트원상 임박" : "신규",
        stock: totalCount,
        gradeStatus,
        imageUrl: data.imageUrl || undefined,
      },
    ]);
    setKujiGrades((prev) => ({ ...prev, [newId]: gradeStatus }));
    kujiForm.reset({
      name: "",
      imageUrl: "",
      grades: DEFAULT_GRADES.map((g) => ({ grade: g, count: 0 })),
    });
    setAddKujiOpen(false);
  };

  if (!ownerShop) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">등록된 매장이 없습니다.</p>
          <Link href="/owner/register">
            <Button className="mt-4">입점 신청하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-foreground">재고 관리</h1>
          <Link href="/">
            <Button variant="ghost" size="sm">
              지도로 돌아가기
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-3">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="font-medium text-sm mb-2">대표 사진</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-square w-20 shrink-0 rounded-lg overflow-hidden bg-muted group"
                    >
                      {representativeImage ? (
                        <Image
                          src={representativeImage}
                          alt="대표 사진"
                          fill
                          className="object-cover group-hover:opacity-80 transition-opacity"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Store className="size-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImagePlus className="size-6 text-white" />
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      {representativeImage ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setRepresentativeImage(null)}
                        >
                          <ImageOff className="size-3 mr-1" />
                          이미지 제거
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImagePlus className="size-3 mr-1" />
                          이미지 추가
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-sm mb-2">매장 정보</h2>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        매장 이름
                      </label>
                      <Input
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="예: ○○ 가챠랜드"
                        className="h-8 mt-0.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        영업시간
                      </label>
                      <Input
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        placeholder="예: 10:00 - 21:00"
                        className="h-8 mt-0.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        휴무요일 (선택)
                      </label>
                      <Input
                        value={closedDays}
                        onChange={(e) => setClosedDays(e.target.value)}
                        placeholder="예: 매주 일요일"
                        className="h-8 mt-0.5 text-sm"
                      />
                    </div>
                  </div>
                  <textarea
                    value={promotionalText}
                    onChange={(e) =>
                      setPromotionalText(e.target.value.slice(0, 100))
                    }
                    placeholder="매장을 소개해주세요"
                    className="w-full min-h-[60px] rounded border border-input px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {promotionalText.length}/100
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={handleSavePromo}
                    disabled={saving}
                  >
                    <Save className="size-3 mr-1" />
                    매장 정보 저장
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-semibold text-primary text-sm">
                  💊 가챠
                </h2>
                <p className="text-xs text-muted-foreground">{lastUpdated}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-border text-primary hover:bg-muted"
                onClick={() => setAddGachaOpen(true)}
              >
                <PlusCircle className="size-3.5 mr-1" />
                가챠 추가
              </Button>
            </div>
            <div className="space-y-2">
              {gachaMachines.map((machine) => (
                <Card
                  key={machine.id}
                  className="bg-secondary/30 border-border"
                >
                  <CardContent className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGachaImageId(machine.id);
                            existingGachaImageRef.current?.click();
                          }}
                          className="relative aspect-square w-12 rounded overflow-hidden bg-hero-gold/20 flex items-center justify-center group border border-border"
                        >
                          {machine.imageUrl ? (
                            <Image
                              src={machine.imageUrl}
                              alt={machine.series}
                              fill
                              className="object-cover group-hover:opacity-80 transition-opacity"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xl">💊</span>
                          )}
                        </button>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-xs text-primary"
                            onClick={() => {
                              setEditingGachaImageId(machine.id);
                              existingGachaImageRef.current?.click();
                            }}
                          >
                            변경
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-xs text-destructive hover:text-destructive disabled:opacity-50"
                            disabled={!machine.imageUrl}
                            onClick={() =>
                              setGachaMachines((prev) =>
                                prev.map((m) =>
                                  m.id === machine.id
                                    ? { ...m, imageUrl: undefined }
                                    : m,
                                ),
                              )
                            }
                          >
                            제거
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {machine.series}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7 rounded-full border-border"
                            onClick={() => updateGachaStock(machine.id, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="text-sm font-bold w-8 text-center">
                            {gachaStocks[machine.id] ?? machine.stock ?? 0}
                          </span>
                          <Button
                            size="icon"
                            className="size-7 rounded-full bg-primary hover:bg-primary/90"
                            onClick={() => updateGachaStock(machine.id, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 border-border text-primary hover:bg-muted"
                      onClick={handleSaveStock}
                      disabled={saving}
                    >
                      <Save className="size-3 mr-1" />
                      저장
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <input
                ref={existingGachaImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGachaImageChange}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-semibold text-primary text-sm">
                  🎫 쿠지
                </h2>
                <p className="text-xs text-muted-foreground">{lastUpdated}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-border text-primary hover:bg-muted"
                onClick={() => setAddKujiOpen(true)}
              >
                <PlusCircle className="size-3.5 mr-1" />
                쿠지 추가
              </Button>
            </div>
            <div className="space-y-2">
              {kujiStatuses.map((status) => {
                const grades =
                  kujiGrades[status.id] ?? status.gradeStatus ?? [];
                return (
                  <Card
                    key={status.id}
                    className="bg-muted border-border"
                  >
                    <CardContent className="py-2 px-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKujiImageId(status.id);
                              existingKujiImageRef.current?.click();
                            }}
                            className="relative aspect-square w-12 rounded overflow-hidden bg-hero-blue-dark/15 flex items-center justify-center group border border-border"
                          >
                            {status.imageUrl ? (
                              <Image
                                src={status.imageUrl}
                                alt={status.name}
                                fill
                                className="object-cover group-hover:opacity-80 transition-opacity"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xl">🎫</span>
                            )}
                          </button>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-xs text-primary"
                              onClick={() => {
                                setEditingKujiImageId(status.id);
                                existingKujiImageRef.current?.click();
                              }}
                            >
                              변경
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-xs text-destructive hover:text-destructive disabled:opacity-50"
                              disabled={!status.imageUrl}
                              onClick={() =>
                                setKujiStatuses((prev) =>
                                  prev.map((s) =>
                                    s.id === status.id
                                      ? { ...s, imageUrl: undefined }
                                      : s,
                                  ),
                                )
                              }
                            >
                              제거
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">
                        {status.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {grades.map((g, idx) => (
                          <div
                            key={g.grade}
                            className="flex items-center gap-0.5 bg-white/80 rounded px-2 py-0.5 border border-border"
                          >
                            <span className="text-xs text-primary font-medium">
                              {g.grade}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 rounded"
                              onClick={() =>
                                updateKujiGrade(status.id, idx, -1)
                              }
                            >
                              <Minus className="size-2.5" />
                            </Button>
                            <span className="text-xs font-bold w-5 text-center">
                              {g.count}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 rounded"
                              onClick={() => updateKujiGrade(status.id, idx, 1)}
                            >
                              <Plus className="size-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-border text-primary hover:bg-muted"
                        onClick={handleSaveStock}
                        disabled={saving}
                      >
                        <Save className="size-3 mr-1" />
                        저장
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              <input
                ref={existingKujiImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleKujiImageChange}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/owner/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            로그아웃
          </Link>
        </div>
      </div>

      <Dialog
        open={addGachaOpen}
        onOpenChange={(open) => {
          setAddGachaOpen(open);
          if (!open) gachaForm.reset({ series: "", stock: 0, imageUrl: "" });
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>가챠 추가</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={gachaForm.handleSubmit(onAddGacha)}
            className="space-y-3 pt-2"
          >
            <div>
              <Label htmlFor="gacha-series">시리즈명 *</Label>
              <Input
                id="gacha-series"
                placeholder="예: 치이카와, 원피스"
                {...gachaForm.register("series")}
              />
              {gachaForm.formState.errors.series && (
                <p className="text-xs text-destructive mt-1">
                  {gachaForm.formState.errors.series.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="gacha-stock">초기 재고 개수</Label>
              <Input
                id="gacha-stock"
                type="number"
                min={0}
                placeholder="0"
                {...gachaForm.register("stock")}
              />
            </div>
            <div>
              <Label>이미지</Label>
              <Controller
                control={gachaForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <div className="flex gap-2 items-center mt-1">
                    <button
                      type="button"
                      onClick={() => newGachaImageInputRef.current?.click()}
                      className="relative aspect-square w-16 rounded-lg overflow-hidden bg-muted border border-dashed border-border flex items-center justify-center"
                    >
                      {field.value ? (
                        <Image
                          src={field.value}
                          alt="미리보기"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ImagePlus className="size-6 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      ref={newGachaImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          e.target.value = "";
                          return;
                        }
                        const result = await uploadImageWithValidation(
                          file,
                          uploadShopImage
                        );
                        e.target.value = "";
                        if ("error" in result) {
                          toast.error(result.error);
                        } else {
                          field.onChange(result.url);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {field.value ? "이미지 선택됨" : "이미지 추가 (선택)"}
                    </span>
                  </div>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              추가하기
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addKujiOpen}
        onOpenChange={(open) => {
          setAddKujiOpen(open);
          if (!open)
            kujiForm.reset({
              name: "",
              imageUrl: "",
              grades: DEFAULT_GRADES.map((g) => ({ grade: g, count: 0 })),
            });
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>쿠지 추가</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={kujiForm.handleSubmit(onAddKuji)}
            className="space-y-3 pt-2"
          >
            <div>
              <Label htmlFor="kuji-name">복권명 *</Label>
              <Input
                id="kuji-name"
                placeholder="예: 스파이패밀리 복권"
                {...kujiForm.register("name")}
              />
              {kujiForm.formState.errors.name && (
                <p className="text-xs text-destructive mt-1">
                  {kujiForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label>대표 이미지 (선택)</Label>
              <Controller
                control={kujiForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <div className="flex gap-2 items-center mt-1">
                    <button
                      type="button"
                      onClick={() => newKujiImageInputRef.current?.click()}
                      className="relative aspect-square w-16 rounded-lg overflow-hidden bg-muted border border-dashed border-border flex items-center justify-center"
                    >
                      {field.value ? (
                        <Image
                          src={field.value}
                          alt="미리보기"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ImagePlus className="size-6 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      ref={newKujiImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          e.target.value = "";
                          return;
                        }
                        const result = await uploadImageWithValidation(
                          file,
                          uploadShopImage
                        );
                        e.target.value = "";
                        if ("error" in result) {
                          toast.error(result.error);
                        } else {
                          field.onChange(result.url);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {field.value ? "이미지 선택됨" : "이미지 추가 (선택)"}
                    </span>
                  </div>
                )}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>등급별 남은 개수</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary"
                  onClick={() =>
                    kujiGradesField.append({ grade: "", count: 0 })
                  }
                >
                  <PlusCircle className="size-3 mr-1" />
                  등급 추가
                </Button>
              </div>
              <div className="space-y-2 mt-1 max-h-48 overflow-y-auto">
                {kujiGradesField.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 rounded border border-border px-2 py-1.5 bg-muted"
                  >
                    <Input
                      placeholder="등급명 (예: A상, 1등)"
                      className="h-7 text-sm flex-1 min-w-0"
                      {...kujiForm.register(`grades.${idx}.grade`)}
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded"
                        onClick={() => {
                          const cur =
                            kujiForm.getValues(`grades.${idx}.count`) ?? 0;
                          kujiForm.setValue(
                            `grades.${idx}.count`,
                            Math.max(0, cur - 1),
                          );
                        }}
                      >
                        <Minus className="size-2.5" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        className="h-7 w-12 text-center text-sm px-1"
                        {...kujiForm.register(`grades.${idx}.count`, {
                          valueAsNumber: true,
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded"
                        onClick={() => {
                          const cur =
                            kujiForm.getValues(`grades.${idx}.count`) ?? 0;
                          kujiForm.setValue(`grades.${idx}.count`, cur + 1);
                        }}
                      >
                        <Plus className="size-2.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => kujiGradesField.remove(idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              {kujiForm.formState.errors.grades?.message && (
                <p className="text-xs text-destructive mt-1">
                  {kujiForm.formState.errors.grades.message}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-sm font-medium text-primary">
                총{" "}
                {(watchedKujiGrades ?? []).reduce(
                  (s, g) => s + (g?.count ?? 0),
                  0,
                )}
                장 남음
              </p>
            </div>
            <Button type="submit" className="w-full">
              추가하기
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

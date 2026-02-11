"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addShopAsAdmin,
  getAdminPendingData,
  approveShopRegistration,
  rejectShopRegistration,
  approveShopClaim,
  rejectShopClaim,
} from "@/app/actions/admin";
import { geocodeAddress, uploadShopImage } from "@/app/actions/owner";
import { queryKeys } from "@/lib/query-keys";
import { MAX_IMAGE_BYTES, MAX_IMAGE_ERROR_MESSAGE } from "@/lib/constants";
import type { RegisterShopInput } from "@/app/actions/owner";
import { Search, Check, X, Shield, ImagePlus, ImageOff, Store } from "lucide-react";
import Image from "next/image";

interface DaumPostcodeData {
  userSelectedType: string;
  roadAddress: string;
  jibunAddress: string;
  bname?: string;
  buildingName?: string;
  apartment?: string;
}

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: pendingData, isLoading: loading } = useQuery({
    queryKey: queryKeys.adminPending,
    queryFn: getAdminPendingData,
  });
  const [addForm, setAddForm] = useState<{
    shopName: string;
    shopType: "GACHA" | "KUJI" | "BOTH";
    address: string;
    detailAddress: string;
    businessHours: string;
    closedDays: string;
    lat: number | null;
    lng: number | null;
  }>({
    shopName: "",
    shopType: "BOTH",
    address: "",
    detailAddress: "",
    businessHours: "10:00 - 21:00",
    closedDays: "",
    lat: null,
    lng: null,
  });
  const [representativeImageFile, setRepresentativeImageFile] = useState<File | null>(null);
  const [representativeImagePreview, setRepresentativeImagePreview] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadPending = () => queryClient.invalidateQueries({ queryKey: queryKeys.adminPending });

  const handleSearchAddress = () => {
    const w = window as unknown as { daum?: { Postcode: new (opts: unknown) => { open: () => void } }; kakao?: { Postcode: new (opts: unknown) => { open: () => void } } };
    const Postcode = w.daum?.Postcode ?? w.kakao?.Postcode;
    if (!Postcode) return;

    new Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const addr =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        let extraAddr = "";
        if (data.userSelectedType === "R") {
          if (data.bname && /[동|로|가]$/g.test(data.bname))
            extraAddr += data.bname;
          if (data.buildingName && data.apartment === "Y") {
            extraAddr += extraAddr ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddr) extraAddr = ` (${extraAddr})`;
        }
        const fullAddr = addr + extraAddr;
        setAddForm((f) => ({ ...f, address: fullAddr }));
        geocodeAddress(fullAddr).then((res) => {
          if (res.ok) {
            setAddForm((f) => ({ ...f, lat: res.lat, lng: res.lng }));
          } else {
            setAddForm((f) => ({ ...f, lat: null, lng: null }));
          }
        });
      },
    }).open();
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addForm.shopName.trim() || !addForm.address.trim()) {
      setAddError("매장 이름과 주소를 입력해주세요.");
      return;
    }
    let lat = addForm.lat;
    let lng = addForm.lng;
    if (lat == null || lng == null) {
      const geo = await geocodeAddress(addForm.address);
      if (!geo.ok) {
        setAddError("주소를 좌표로 변환할 수 없습니다.");
        return;
      }
      lat = geo.lat;
      lng = geo.lng;
    }
    setAdding(true);
    let representativeImageUrl: string | null = null;
    if (representativeImageFile) {
      const formData = new FormData();
      formData.append("file", representativeImageFile);
      const uploadResult = await uploadShopImage(formData);
      if ("error" in uploadResult) {
        setAddError(uploadResult.error);
        setAdding(false);
        return;
      }
      representativeImageUrl = uploadResult.url;
    }
    const input: RegisterShopInput = {
      shopName: addForm.shopName.trim(),
      shopType: addForm.shopType,
      email: "admin@local",
      address: addForm.address,
      detailAddress: addForm.detailAddress || undefined,
      businessNumber: "000-00-00000",
      businessHours: addForm.businessHours,
      closedDays: addForm.closedDays || undefined,
      representativeImageUrl,
      lat,
      lng,
    };
    const result = await addShopAsAdmin(input);
    setAdding(false);
    if (!result.success) {
      setAddError(result.error ?? "매장 등록에 실패했습니다.");
      return;
    }
    setAddForm({
      shopName: "",
      shopType: "BOTH",
      address: "",
      detailAddress: "",
      businessHours: "10:00 - 21:00",
      closedDays: "",
      lat: null,
      lng: null,
    });
    setRepresentativeImageFile(null);
    setRepresentativeImagePreview(null);
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    await loadPending();
  };

  const handleApproveRegistration = async (shopId: number) => {
    setActingId(`reg-${shopId}`);
    await approveShopRegistration(shopId);
    setActingId(null);
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    await loadPending();
  };

  const handleRejectRegistration = async (shopId: number) => {
    setActingId(`rej-reg-${shopId}`);
    await rejectShopRegistration(shopId);
    setActingId(null);
    await loadPending();
  };

  const handleApproveClaim = async (claimId: number) => {
    setActingId(`claim-${claimId}`);
    await approveShopClaim(claimId);
    setActingId(null);
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    await loadPending();
  };

  const handleRejectClaim = async (claimId: number) => {
    setActingId(`rej-claim-${claimId}`);
    await rejectShopClaim(claimId);
    setActingId(null);
    await loadPending();
  };

  const registrations = pendingData?.registrations ?? [];
  const claims = pendingData?.claims ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="size-6" />
            운영자 대시보드
          </h1>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 지도로
          </Link>
        </div>

        <Tabs defaultValue="approve" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approve">승인 대기</TabsTrigger>
            <TabsTrigger value="add">매장 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="approve" className="space-y-6">
            {loading ? (
              <p className="text-muted-foreground">로딩 중...</p>
            ) : (
              <>
                {registrations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        신규 등록 승인 대기 ({registrations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {registrations.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{r.shopName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {r.address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              신청자: {r.ownerName} ({r.ownerEmail})
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleApproveRegistration(r.shopId)}
                              disabled={actingId !== null}
                            >
                              {actingId === `reg-${r.shopId}` ? (
                                "..."
                              ) : (
                                <>
                                  <Check className="size-4 mr-1" />
                                  승인
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRegistration(r.shopId)}
                              disabled={actingId !== null}
                            >
                              {actingId === `rej-reg-${r.shopId}` ? (
                                "..."
                              ) : (
                                <>
                                  <X className="size-4 mr-1" />
                                  거절
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {claims.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        클레임 승인 대기 ({claims.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {claims.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{c.shopName}</p>
                            <p className="text-xs text-muted-foreground">
                              클레임 신청: {c.ownerName} ({c.ownerEmail})
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleApproveClaim(c.id)}
                              disabled={actingId !== null}
                            >
                              {actingId === `claim-${c.id}` ? (
                                "..."
                              ) : (
                                <>
                                  <Check className="size-4 mr-1" />
                                  승인
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectClaim(c.id)}
                              disabled={actingId !== null}
                            >
                              {actingId === `rej-claim-${c.id}` ? (
                                "..."
                              ) : (
                                <>
                                  <X className="size-4 mr-1" />
                                  거절
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {registrations.length === 0 && claims.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      승인 대기 중인 항목이 없습니다.
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">매장 직접 추가</CardTitle>
                <p className="text-sm text-muted-foreground">
                  운영자가 추가한 매장은 즉시 공개됩니다.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddShop} className="space-y-4">
                  {addError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {addError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>매장 이름 *</Label>
                    <Input
                      value={addForm.shopName}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, shopName: e.target.value }))
                      }
                      placeholder="매장 이름"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>매장 유형</Label>
                    <div className="flex gap-2">
                      {(["GACHA", "KUJI", "BOTH"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setAddForm((f) => ({ ...f, shopType: t }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            addForm.shopType === t
                              ? "bg-secondary/50 border border-primary"
                              : "bg-muted"
                          }`}
                        >
                          {t === "GACHA" ? "가챠" : t === "KUJI" ? "쿠지" : "둘 다"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>대표 이미지 (선택)</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("admin-representative-image-input")?.click()
                        }
                        className="relative aspect-square w-20 shrink-0 rounded-lg overflow-hidden bg-muted border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors group"
                      >
                        {representativeImagePreview ? (
                          <Image
                            src={representativeImagePreview}
                            alt="대표 이미지 미리보기"
                            fill
                            className="object-cover group-hover:opacity-80 transition-opacity"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                            <Store className="size-8" />
                            <span className="text-xs">이미지 추가</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="size-6 text-white" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {representativeImageFile ? (
                          <>
                            <p className="text-sm text-muted-foreground truncate">
                              {representativeImageFile.name}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-fit h-7 text-xs"
                              onClick={() => {
                                if (representativeImagePreview?.startsWith("blob:")) {
                                  URL.revokeObjectURL(representativeImagePreview);
                                }
                                setRepresentativeImageFile(null);
                                setRepresentativeImagePreview(null);
                              }}
                            >
                              <ImageOff className="size-3 mr-1" />
                              이미지 제거
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, WebP, GIF (최대 5MB)
                          </p>
                        )}
                      </div>
                    </div>
                    <input
                      id="admin-representative-image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > MAX_IMAGE_BYTES) {
                            setAddError(MAX_IMAGE_ERROR_MESSAGE);
                            return;
                          }
                          setRepresentativeImageFile(file);
                          setRepresentativeImagePreview(URL.createObjectURL(file));
                          setAddError(null);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>주소 *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={addForm.address}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, address: e.target.value }))
                        }
                        placeholder="주소 검색"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchAddress}
                      >
                        <Search className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="상세주소"
                      value={addForm.detailAddress}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          detailAddress: e.target.value,
                        }))
                      }
                    />
                    {addForm.lat != null && (
                      <p className="text-xs text-primary">
                        ✓ 위치 확인됨
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>영업시간</Label>
                      <Input
                        value={addForm.businessHours}
                        onChange={(e) =>
                          setAddForm((f) => ({
                            ...f,
                            businessHours: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>휴무요일</Label>
                      <Input
                        value={addForm.closedDays}
                        onChange={(e) =>
                          setAddForm((f) => ({
                            ...f,
                            closedDays: e.target.value,
                          }))
                        }
                        placeholder="예: 매주 일요일"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={adding}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {adding ? "등록 중..." : "매장 추가"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

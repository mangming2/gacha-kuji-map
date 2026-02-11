"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Info, Search, ImagePlus, ImageOff, Store } from "lucide-react";
import {
  geocodeAddress,
  registerShop,
  uploadShopImage,
  getNearbyShopsAction,
  claimShop,
} from "@/app/actions/owner";
import { toast } from "sonner";
import type { Shop, ShopType } from "@/types/shop";
import { queryKeys } from "@/lib/query-keys";
import { MAX_IMAGE_BYTES, MAX_IMAGE_ERROR_MESSAGE } from "@/lib/constants";

const SHOP_TYPES: { value: ShopType; label: string }[] = [
  { value: "GACHA", label: "💊 가챠" },
  { value: "KUJI", label: "🎫 쿠지" },
  { value: "BOTH", label: "💊🎫 둘 다" },
];

const registerSchema = z.object({
  shopName: z.string().min(1, "매장 이름을 입력해주세요"),
  shopType: z.enum(["GACHA", "KUJI", "BOTH"]),
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일을 입력해주세요"),
  phone: z.string().optional(),
  address: z.string().min(1, "주소를 입력해주세요"),
  detailAddress: z.string().optional(),
  businessNumber: z.string().min(1, "사업자등록번호를 입력해주세요"),
  businessHours: z.string().optional(),
  closedDays: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface DaumPostcodeData {
  userSelectedType: string;
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
  bname?: string;
  buildingName?: string;
  apartment?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      shopName: "",
      shopType: "BOTH",
      email: "",
      phone: "",
      address: "",
      detailAddress: "",
      businessNumber: "000-00-00000",
      businessHours: "10:00 - 21:00",
      closedDays: "",
    },
  });

  const [geocodedLatLng, setGeocodedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyShops, setNearbyShops] = useState<Shop[] | null>(null);
  const [skipNearbyCheck, setSkipNearbyCheck] = useState(false);
  const [claimingShopId, setClaimingShopId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [representativeImageFile, setRepresentativeImageFile] =
    useState<File | null>(null);
  const [representativeImagePreview, setRepresentativeImagePreview] = useState<
    string | null
  >(null);

  const handleSearchAddress = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Daum/Kakao Postcode API
    const w = window as any;
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
            extraAddr += extraAddr
              ? `, ${data.buildingName}`
              : data.buildingName;
          }
          if (extraAddr) extraAddr = ` (${extraAddr})`;
        }
        const fullAddr = addr + extraAddr;
        setValue("address", fullAddr, { shouldValidate: true });

        geocodeAddress(fullAddr).then(async (res) => {
          if (res.ok) {
            setGeocodedLatLng({ lat: res.lat, lng: res.lng });
            setNearbyShops(null);
            setSkipNearbyCheck(false);
            const nearby = await getNearbyShopsAction(res.lat, res.lng, 50);
            setNearbyShops(nearby);
          } else {
            setGeocodedLatLng(null);
            setNearbyShops(null);
          }
        });
      },
    }).open();
  };

  const handleClaimShop = async (shopId: number) => {
    setFormError(null);
    setClaimingShopId(shopId);
    const result = await claimShop(shopId);
    setClaimingShopId(null);
    if (!result.success) {
      const msg = result.error ?? "클레임 신청에 실패했습니다.";
      toast.error(msg);
      setFormError(msg);
      return;
    }
    toast.success(
      "클레임 신청이 접수되었습니다. 운영자 승인 후 관리할 수 있습니다.",
    );
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    await queryClient.invalidateQueries({ queryKey: queryKeys.authState });
    router.push("/owner/shops");
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null);
    // 지오코딩은 검색한 기본 주소만 사용 (상세주소 제외)
    const baseAddress = data.address?.trim() ?? "";
    let lat = geocodedLatLng?.lat;
    let lng = geocodedLatLng?.lng;

    // 주소가 있는데 좌표가 없으면 서버 API로 Geocoding
    if (baseAddress && (lat == null || lng == null)) {
      const res = await geocodeAddress(baseAddress);
      if (res.ok) {
        lat = res.lat;
        lng = res.lng;
        setGeocodedLatLng({ lat: res.lat, lng: res.lng });
      } else {
        const msg =
          "주소를 좌표로 변환할 수 없습니다. Kakao Developers에서 로컬 API를 활성화하고 KAKAO_REST_API_KEY를 .env에 설정해주세요.";
        toast.error(msg);
        setFormError(msg);
        return;
      }
    }

    let representativeImageUrl: string | null = null;
    if (representativeImageFile) {
      const formData = new FormData();
      formData.append("file", representativeImageFile);
      const uploadResult = await uploadShopImage(formData);
      if ("error" in uploadResult) {
        toast.error(uploadResult.error);
        setFormError(uploadResult.error);
        return;
      }
      representativeImageUrl = uploadResult.url;
    }

    const result = await registerShop({
      ...data,
      phone: data.phone || undefined,
      detailAddress: data.detailAddress || undefined,
      businessHours: data.businessHours || undefined,
      closedDays: data.closedDays || undefined,
      representativeImageUrl,
      lat,
      lng,
    });

    if (!result.success) {
      const msg = result.error ?? "입점 신청에 실패했습니다.";
      toast.error(msg);
      setFormError(msg);
      return;
    }
    toast.success(
      "pending" in result && result.pending
        ? "추가 요청이 접수되었습니다. 운영자 승인 후 지도에 등록됩니다."
        : "정상적으로 등록되었습니다.",
    );
    await queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    await queryClient.invalidateQueries({ queryKey: queryKeys.authState });
    if ("pending" in result && result.pending) {
      router.push("/owner/shops?pending=1");
    } else {
      router.push("/owner/shops");
    }
  };

  const shopType = useWatch({
    control,
    name: "shopType",
    defaultValue: "BOTH",
  });

  return (
    <div className="min-h-screen bg-muted/50">
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />
      <div className="container max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">입점 신청 요청</h1>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex gap-3 p-4 rounded-lg bg-muted border border-border">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary">입점 가능 업종 확인</p>
              <p className="text-muted-foreground mt-1">
                가챠샵, 쿠지샵, 복합 매장이 주요 대상입니다.
              </p>
              <p className="text-muted-foreground mt-2 font-medium">
                운영자 승인 후 지도에 등록됩니다.
              </p>
            </div>
          </div>
        </div>

        {nearbyShops && nearbyShops.length > 0 && !skipNearbyCheck && (
          <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border">
            <p className="font-semibold text-foreground mb-3">
              이 근처에 등록된 매장이 있어요
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              내 매장이면 클레임을 신청해주세요. 운영자 승인 후 관리할 수
              있습니다.
            </p>
            <ul className="space-y-2 mb-4">
              {nearbyShops.map((shop) => (
                <li
                  key={shop.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-card border border-border"
                >
                  <div>
                    <span className="font-medium">{shop.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {shop.address}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 bg-primary hover:bg-primary/90"
                    onClick={() => handleClaimShop(shop.id)}
                    disabled={claimingShopId !== null}
                  >
                    {claimingShopId === shop.id
                      ? "신청 중..."
                      : "이 매장이에요"}
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
              onClick={() => setSkipNearbyCheck(true)}
            >
              없어요, 신규 등록할게요
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="shopName">
              매장 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shopName"
              placeholder="운영 중인 매장 이름을 입력해주세요"
              className="bg-background"
              {...register("shopName")}
            />
            {errors.shopName && (
              <p className="text-sm text-destructive">
                {errors.shopName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              매장 유형 <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {SHOP_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("shopType", opt.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    shopType === opt.value
                      ? "bg-secondary/50 border-primary text-primary"
                      : "bg-background border-input hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              지도 필터에서 검색될 매장 유형입니다
            </p>
          </div>

          <div className="space-y-2">
            <Label>대표 이미지 (선택)</Label>
            <p className="text-xs text-muted-foreground">
              필수는 아닙니다. 나중에 대시보드에서도 추가·수정할 수 있습니다.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("representative-image-input")?.click()
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
              id="representative-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > MAX_IMAGE_BYTES) {
                    setFormError(MAX_IMAGE_ERROR_MESSAGE);
                    return;
                  }
                  setRepresentativeImageFile(file);
                  setRepresentativeImagePreview(URL.createObjectURL(file));
                  setFormError(null);
                }
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              이메일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              className="bg-background"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">연락처 (선택)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              className="bg-background"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessHours">영업시간</Label>
            <Input
              id="businessHours"
              placeholder="예: 10:00 - 21:00"
              className="bg-background"
              {...register("businessHours")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closedDays">휴무요일 (선택)</Label>
            <Input
              id="closedDays"
              placeholder="예: 매주 일요일"
              className="bg-background"
              {...register("closedDays")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              매장 주소 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="우편번호 검색을 눌러 주소를 입력해주세요"
                className="bg-background flex-1"
                {...register("address")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchAddress}
                className="shrink-0 gap-1"
              >
                <Search className="size-4" />
                주소 검색
              </Button>
            </div>
            <Input
              placeholder="상세주소 (층, 호수 등)"
              className="bg-background"
              {...register("detailAddress")}
            />
            {geocodedLatLng && (
              <p className="text-xs text-primary">
                ✓ 위치가 확인되었습니다
              </p>
            )}
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessNumber">
              사업자등록번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessNumber"
              placeholder="000-00-00000"
              className="bg-background"
              {...register("businessNumber")}
            />
            <p className="text-xs text-muted-foreground">
              사업자등록증의 등록번호 10자리를 입력해주세요
            </p>
            {errors.businessNumber && (
              <p className="text-sm text-destructive">
                {errors.businessNumber.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
          >
            {isSubmitting ? "요청 중..." : "추가 요청하기"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/owner/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

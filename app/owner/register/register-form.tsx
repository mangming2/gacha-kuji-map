"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Search } from "lucide-react";
import {
  geocodeAddress,
  registerShop,
  type ShopType,
} from "@/app/actions/owner";

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
  // Maps 키 없으면 Geocoder 불가
  const [mapsLoaded, setMapsLoaded] = useState(
    !process.env.NEXT_PUBLIC_KAKAO_MAP_KEY,
  );

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
  const [formError, setFormError] = useState<string | null>(null);

  /** 1) 클라이언트 Geocoder (Maps SDK) */
  const geocodeClient = (
    address: string,
  ): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (
        typeof window === "undefined" ||
        !window.kakao?.maps?.services?.Geocoder
      ) {
        resolve(null);
        return;
      }
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(
        address,
        (result: { y: string; x: string }[], status: string) => {
          const ok =
            status === "OK" ||
            status === window.kakao?.maps?.services?.Status?.OK;
          if (ok && result?.[0]) {
            resolve({
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
            });
          } else {
            resolve(null);
          }
        },
      );
    });

  /** 2) 클라이언트 REST API (로컬 API 키 필요, 브라우저에서 직접 호출) */
  const geocodeViaRestApi = async (
    address: string,
  ): Promise<{ lat: number; lng: number } | null> => {
    const key =
      process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ??
      process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) return null;
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        { headers: { Authorization: `KakaoAK ${key}` } },
      );
      const data = await res.json();
      const doc = data.documents?.[0];
      if (doc?.y && doc?.x) {
        return {
          lat: parseFloat(doc.y),
          lng: parseFloat(doc.x),
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  };

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

        // 클라이언트 Geocoder 사용 (지도와 동일한 JavaScript 키)
        if (mapsLoaded && window.kakao?.maps?.services?.Geocoder) {
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(fullAddr, (result, status) => {
            if (
              (status === "OK" ||
                status === window.kakao?.maps?.services?.Status?.OK) &&
              result[0]
            ) {
              setGeocodedLatLng({
                lat: parseFloat(result[0].y),
                lng: parseFloat(result[0].x),
              });
            } else {
              setGeocodedLatLng(null);
            }
          });
        } else {
          setGeocodedLatLng(null);
        }
      },
    }).open();
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null);
    const fullAddress = [data.address, data.detailAddress]
      .filter(Boolean)
      .join(" ");
    let lat = geocodedLatLng?.lat;
    let lng = geocodedLatLng?.lng;

    // 주소가 있는데 좌표가 없으면 Geocoding 시도 (3단계 fallback)
    if (fullAddress && (lat == null || lng == null)) {
      let coords = await geocodeClient(fullAddress);
      if (!coords) {
        const serverGeo = await geocodeAddress(fullAddress);
        if (serverGeo.ok) {
          coords = { lat: serverGeo.lat, lng: serverGeo.lng };
        }
      }
      if (!coords) {
        coords = await geocodeViaRestApi(fullAddress);
      }
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        setGeocodedLatLng(coords);
      } else {
        setFormError(
          "주소를 좌표로 변환할 수 없습니다. Kakao Developers에서 로컬 API를 활성화하고 KAKAO_REST_API_KEY를 .env에 설정해주세요.",
        );
        return;
      }
    }

    const result = await registerShop({
      ...data,
      phone: data.phone || undefined,
      detailAddress: data.detailAddress || undefined,
      businessHours: data.businessHours || undefined,
      closedDays: data.closedDays || undefined,
      lat,
      lng,
    });

    if (!result.success) {
      setFormError(result.error ?? "입점 신청에 실패했습니다.");
      return;
    }
    router.push("/owner/shops");
  };

  const shopType = useWatch({
    control,
    name: "shopType",
    defaultValue: "BOTH",
  });

  return (
    <div className="min-h-screen bg-emerald-50/50">
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />
      {process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window !== "undefined" && window.kakao?.maps) {
              window.kakao.maps.load(() => setMapsLoaded(true));
            } else {
              setMapsLoaded(true);
            }
          }}
        />
      )}
      <div className="container max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">입점 신청</h1>
          <p className="text-sm text-muted-foreground mt-1">
            사업자등록증을 통한 간편 인증으로 빠르게 입점하세요.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">입점 가능 업종 확인</p>
              <p className="text-blue-700 mt-1">
                가챠샵, 쿠지샵, 복합 매장이 주요 대상입니다.
              </p>
              <button
                type="button"
                className="mt-2 text-blue-600 hover:underline font-medium"
                onClick={() => alert("자세한 입점 기준 준비 중입니다.")}
              >
                자세한 입점 기준 보기 →
              </button>
            </div>
          </div>
        </div>

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
                      ? "bg-amber-100 border-amber-500 text-amber-800"
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
              <p className="text-xs text-emerald-600">
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
            className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white mt-6"
          >
            {isSubmitting ? "등록 중..." : "사업자등록증 제출하기"}
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

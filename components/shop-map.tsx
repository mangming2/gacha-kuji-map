"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Shop, ShopType } from "@/types/shop";

const MARKER_STYLES: Record<
  ShopType,
  { bg: string; emoji: string; border: string }
> = {
  GACHA: { bg: "bg-amber-400", emoji: "💊", border: "border-amber-500" },
  KUJI: { bg: "bg-violet-500", emoji: "🎫", border: "border-violet-600" },
  BOTH: { bg: "bg-rose-500", emoji: "👑", border: "border-rose-600" },
};

interface ShopMapProps {
  shops: Shop[];
  onMarkerClick?: (shop: Shop) => void;
  moveToMyLocationTrigger?: number;
}

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}

export function ShopMap({
  shops,
  onMarkerClick,
  moveToMyLocationTrigger = 0,
}: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const createMarkerElement = useCallback(
    (shop: Shop) => {
      const style = MARKER_STYLES[shop.type];
      const div = document.createElement("div");
      div.className = `cursor-pointer w-10 h-10 rounded-full ${style.bg} ${style.border} border-2 flex items-center justify-center text-lg shadow-lg hover:scale-110 transition-transform select-none`;
      div.innerHTML = style.emoji;
      div.dataset.shopId = String(shop.id);
      div.title = shop.name;
      return div;
    },
    []
  );

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_KAKAO_MAP_KEY is not set");
      return;
    }

    if (!mapRef.current) return;

    const loadMap = () => {
      if (typeof window === "undefined" || !window.kakao?.maps || !mapRef.current)
        return;

      const center = new window.kakao.maps.LatLng(37.5665, 126.978);
      const options = {
        center,
        level: 7,
      };
      const map = new window.kakao.maps.Map(mapRef.current, options);
      mapInstanceRef.current = map;
      setMapReady(true);

      // 컨테이너 크기 계산 후 지도 다시 그리기 (React 렌더 타이밍 대응)
      const relayout = () => {
        if (typeof map.relayout === "function") map.relayout();
      };
      requestAnimationFrame(relayout);
      setTimeout(relayout, 100);
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(loadMap);
    } else {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(loadMap);
      };
      document.head.appendChild(script);
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    shops.forEach((shop) => {
      const [lat, lng] = shop.position;
      const position = new window.kakao.maps.LatLng(lat, lng);

      const content = createMarkerElement(shop);
      content.addEventListener("click", () => {
        onMarkerClick?.(shop);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1,
      });
      overlay.setMap(mapInstanceRef.current);
      markersRef.current.push(overlay);
    });
  }, [mapReady, shops, onMarkerClick, createMarkerElement]);

  // 내 위치로 이동
  useEffect(() => {
    if (
      moveToMyLocationTrigger <= 0 ||
      !mapReady ||
      !mapInstanceRef.current ||
      typeof navigator?.geolocation === "undefined"
    ) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const center = new window.kakao.maps.LatLng(latitude, longitude);
        mapInstanceRef.current?.setCenter(center);
        mapInstanceRef.current?.setLevel?.(4);
      },
      () => {
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
      },
      { enableHighAccuracy: true }
    );
  }, [moveToMyLocationTrigger, mapReady]);

  return (
    <div className="absolute inset-0 w-full h-full min-h-[400px]">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
          <p className="text-muted-foreground text-center px-4">
            .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해주세요.
            <br />
            <a
              href="https://developers.kakao.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              카카오 개발자 콘솔
            </a>
            에서 발급받을 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

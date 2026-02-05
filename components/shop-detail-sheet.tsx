"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Shop } from "@/types/shop";
import { Clock, MapPin, Store, FileText } from "lucide-react";

function GachaContent({ shop }: { shop: Shop }) {
  if (!shop.gachaMachines || shop.gachaMachines.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        가챠 머신 정보가 없습니다.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {shop.gachaMachines.map((machine) => (
        <li
          key={machine.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
        >
          {machine.imageUrl ? (
            <div className="relative aspect-square w-12 shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={machine.imageUrl}
                alt={machine.series}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="aspect-square w-12 shrink-0 rounded bg-amber-100 flex items-center justify-center text-amber-600 text-lg">
              💊
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="font-medium">{machine.series}</span>
            <span className="text-sm text-muted-foreground block truncate">
              {machine.name}
            </span>
          </div>
          {machine.stock != null && (
            <span className="text-sm font-medium text-amber-700 shrink-0">
              {machine.stock}개
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function KujiContent({ shop }: { shop: Shop }) {
  if (!shop.kujiStatuses || shop.kujiStatuses.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        쿠지 현황 정보가 없습니다.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {shop.kujiStatuses.map((status) => (
        <li
          key={status.id}
          className="flex gap-3 p-3 rounded-lg bg-muted/50 space-y-1.5"
        >
          {status.imageUrl ? (
            <div className="relative aspect-square w-12 shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={status.imageUrl}
                alt={status.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="aspect-square w-12 shrink-0 rounded bg-violet-100 flex items-center justify-center text-violet-600 text-lg">
              🎫
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium">{status.name}</span>
            <Badge
              variant={
                status.status.includes("임박") ? "destructive" : "secondary"
              }
            >
              {status.status}
            </Badge>
          </div>
          {status.gradeStatus && status.gradeStatus.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {status.gradeStatus
                .filter((g) => g.count > 0)
                .map((g) => (
                  <span
                    key={g.grade}
                    className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800"
                  >
                    {g.grade} {g.count}개
                  </span>
                ))}
            </div>
          )}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface ShopDetailSheetProps {
  shop: Shop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShopDetailSheet({ shop, open, onOpenChange }: ShopDetailSheetProps) {
  if (!shop) return null;

  const categoryLabels = {
    GACHA: "가챠",
    KUJI: "쿠지",
    BOTH: "가챠 + 쿠지",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl h-[70vh] max-h-[600px]"
        showCloseButton={true}
      >
        <SheetHeader className="pb-2">
          <div className="flex gap-3">
            {shop.representativeImageUrl ? (
              <div className="relative aspect-square w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={shop.representativeImageUrl}
                  alt={shop.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-square w-20 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                <Store className="size-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold truncate">
                {shop.name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant={shop.isOpen ? "default" : "secondary"}
                  className={
                    shop.isOpen
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-muted"
                  }
                >
                  {shop.isOpen ? "영업중" : "영업종료"}
                </Badge>
                <Badge variant="outline">{categoryLabels[shop.type]}</Badge>
                {shop.stockStatus && (
                  <Badge variant="secondary">{shop.stockStatus}</Badge>
                )}
              </div>
            </div>
          </div>
          {shop.promotionalText ? (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {shop.promotionalText}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <FileText className="size-4 shrink-0" />
              <span>가게 설명이 없습니다</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Clock className="size-4 shrink-0" />
            <span>{shop.businessHours}</span>
          </div>
          {shop.closedDays && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="shrink-0">휴무</span>
              <span>{shop.closedDays}</span>
            </div>
          )}
          {shop.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="size-4 shrink-0" />
              <span>{shop.address}</span>
            </div>
          )}
        </SheetHeader>

        {shop.type === "BOTH" ? (
          <Tabs defaultValue="gacha" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gacha">💊 가챠</TabsTrigger>
              <TabsTrigger value="kuji">🎫 쿠지</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 px-4">
              <TabsContent value="gacha" className="mt-0">
                <GachaContent shop={shop} />
              </TabsContent>
              <TabsContent value="kuji" className="mt-0">
                <KujiContent shop={shop} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 px-4">
            {shop.type === "GACHA" ? (
              <GachaContent shop={shop} />
            ) : (
              <KujiContent shop={shop} />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

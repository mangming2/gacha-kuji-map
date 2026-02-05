"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Shop } from "@/types/shop";
import { Clock } from "lucide-react";

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
          <div className="flex items-start justify-between gap-2">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Clock className="size-4 shrink-0" />
            <span>{shop.businessHours}</span>
          </div>
        </SheetHeader>

        <Tabs defaultValue={shop.type === "KUJI" ? "kuji" : "gacha"} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gacha" disabled={shop.type === "KUJI"}>
              💊 가챠
            </TabsTrigger>
            <TabsTrigger value="kuji" disabled={shop.type === "GACHA"}>
              🎫 쿠지
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="gacha" className="mt-0">
              {shop.gachaMachines && shop.gachaMachines.length > 0 ? (
                <ul className="space-y-2">
                  {shop.gachaMachines.map((machine) => (
                    <li
                      key={machine.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{machine.series}</span>
                      <span className="text-sm text-muted-foreground">
                        {machine.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  가챠 머신 정보가 없습니다.
                </p>
              )}
            </TabsContent>

            <TabsContent value="kuji" className="mt-0">
              {shop.kujiStatuses && shop.kujiStatuses.length > 0 ? (
                <ul className="space-y-2">
                  {shop.kujiStatuses.map((status) => (
                    <li
                      key={status.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{status.name}</span>
                      <Badge
                        variant={
                          status.status.includes("임박")
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {status.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  쿠지 현황 정보가 없습니다.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

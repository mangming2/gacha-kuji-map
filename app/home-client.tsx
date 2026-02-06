"use client";

import { useMemo, useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { ShopMap } from "@/components/shop-map";
import { FilterTabs, type FilterState } from "@/components/filter-tabs";
import { ShopDetailSheet } from "@/components/shop-detail-sheet";
import { MenuSheet } from "@/components/menu-sheet";
import { Button } from "@/components/ui/button";
import { useShops } from "@/lib/hooks/use-shops";
import type { Shop } from "@/types/shop";

function filterShops(shops: Shop[], filter: FilterState): Shop[] {
  const { gacha, kuji } = filter;

  if (!gacha && !kuji) {
    return [];
  }

  return shops.filter((shop) => {
    if (gacha && kuji) {
      return true;
    }
    if (gacha) {
      return shop.type === "GACHA" || shop.type === "BOTH";
    }
    if (kuji) {
      return shop.type === "KUJI" || shop.type === "BOTH";
    }
    return false;
  });
}

interface HomeClientProps {
  initialShops: Shop[];
}

export function HomeClient({ initialShops }: HomeClientProps) {
  const { data: shops = initialShops } = useShops(initialShops);
  const [filter, setFilter] = useState<FilterState>({
    gacha: true,
    kuji: true,
  });
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moveToLocationTrigger, setMoveToLocationTrigger] = useState(0);

  const filteredShops = useMemo(
    () => filterShops(shops, filter),
    [shops, filter]
  );

  const handleMarkerClick = useCallback((shop: Shop) => {
    setSelectedShop(shop);
    setSheetOpen(true);
  }, []);

  const handleMoveToMyLocation = useCallback(() => {
    setMoveToLocationTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden">
      <ShopMap
        shops={filteredShops}
        onMarkerClick={handleMarkerClick}
        moveToMyLocationTrigger={moveToLocationTrigger}
      />

      <header className="absolute top-0 left-0 right-0 z-10 p-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="inline-flex p-2 rounded-2xl bg-background/95 backdrop-blur-sm shadow-lg w-fit">
              <FilterTabs filter={filter} onChange={setFilter} />
            </div>
          </div>
          <MenuSheet />
        </div>
      </header>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={handleMoveToMyLocation}
          className="rounded-full bg-foreground text-background shadow-lg hover:bg-foreground/90 px-6 py-6 font-medium"
        >
          <MapPin className="size-5 mr-2" />
          내위치 기준 탐색
        </Button>
      </div>

      <ShopDetailSheet
        shop={selectedShop}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

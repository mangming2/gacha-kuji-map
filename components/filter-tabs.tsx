"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterState = {
  gacha: boolean;
  kuji: boolean;
};

interface FilterTabsProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

export function FilterTabs({ filter, onChange }: FilterTabsProps) {
  const toggleGacha = () => {
    onChange({ ...filter, gacha: !filter.gacha });
  };

  const toggleKuji = () => {
    onChange({ ...filter, kuji: !filter.kuji });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={filter.gacha ? "default" : "outline"}
        size="sm"
        onClick={toggleGacha}
        className={cn(
          "rounded-full font-medium transition-all",
          filter.gacha && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
        )}
      >
        💊 가챠
      </Button>
      <Button
        variant={filter.kuji ? "default" : "outline"}
        size="sm"
        onClick={toggleKuji}
        className={cn(
          "rounded-full font-medium transition-all",
          filter.kuji && "bg-violet-500 hover:bg-violet-600 text-white border-violet-500"
        )}
      >
        🎫 쿠지
      </Button>
    </div>
  );
}

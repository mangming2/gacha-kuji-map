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
          filter.gacha && "bg-hero-gold hover:bg-hero-gold-soft text-hero-black border-hero-gold"
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
          filter.kuji && "bg-hero-blue-dark hover:bg-hero-blue text-white border-hero-blue-dark"
        )}
      >
        🎫 쿠지
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, PlusCircle, Trash2 } from "lucide-react";
import { deleteShop } from "@/app/actions/owner";
import { toast } from "sonner";

type ShopItem = { id: number; name: string };

export function ShopListClient({ shops }: { shops: ShopItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, shopId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 매장을 삭제하면 복구할 수 없습니다. 정말 삭제할까요?")) return;
    setDeletingId(shopId);
    const result = await deleteShop(shopId);
    setDeletingId(null);
    if (result.success) {
      toast.success("매장이 삭제되었습니다.");
      router.refresh();
    } else {
      toast.error(result.error ?? "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-3">
      {shops.map((shop) => (
        <Card
          key={shop.id}
          className="hover:bg-muted/50 transition-colors overflow-hidden"
        >
          <Link href={`/owner/dashboard?shopId=${shop.id}`} className="block">
            <CardContent className="flex items-center gap-3 py-4 pr-2">
              <Store className="size-5 text-primary shrink-0" />
              <span className="font-medium flex-1 min-w-0 truncate">
                {shop.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => handleDelete(e, shop.id)}
                disabled={deletingId === shop.id}
                aria-label={`${shop.name} 삭제`}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}

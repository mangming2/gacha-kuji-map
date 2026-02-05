"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, HelpCircle, LogIn, Store, PlusCircle, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FaqDialog } from "@/components/faq-dialog";
import { getAuthState, signOut } from "@/app/actions/owner";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function MenuSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  /** null = 로딩 중, 0 = 업장 없음, >0 = 업장 있음 */
  const [shopCount, setShopCount] = useState<number | null>(null);

  useEffect(() => {
    getAuthState().then(({ user: u, shopCount: c }) => {
      setUser(u);
      setShopCount(c);
    });
  }, []);

  // 메뉴 열 때마다 최신 인증 상태 반영 (다른 탭에서 로그인한 경우 등)
  useEffect(() => {
    if (open) {
      getAuthState().then(({ user: u, shopCount: c }) => {
        setUser(u);
        setShopCount(c);
      });
    }
  }, [open]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setShopCount(0);
    setOpen(false);
  };

  const baseItems: MenuItem[] = [
    {
      id: "faq",
      label: "FAQ",
      icon: <HelpCircle className="size-5" />,
      onClick: () => setFaqOpen(true),
    },
  ];

  const ownerItems: MenuItem[] = user
    ? [
        ...(shopCount === null || shopCount > 0
          ? [
              {
                id: "owner-shops",
                label: "업장 관리",
                icon: <Store className="size-5" />,
                onClick: () => router.push("/owner/shops"),
                disabled: shopCount === null,
              },
            ]
          : []),
        {
          id: "owner-register",
          label: "업장 추가",
          icon: <PlusCircle className="size-5" />,
          onClick: () => router.push("/owner/register"),
        },
        {
          id: "owner-logout",
          label: "로그아웃",
          icon: <LogOut className="size-5" />,
          onClick: handleLogout,
        },
      ]
    : [
        {
          id: "owner-login",
          label: "사장님 로그인",
          icon: <LogIn className="size-5" />,
          onClick: () => router.push("/owner/login"),
        },
      ];

  const MENU_ITEMS = [...baseItems, ...ownerItems];

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            aria-label="메뉴 열기"
          >
            <Menu className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>메뉴</SheetTitle>
            <SheetDescription className="sr-only">
              FAQ, 사장님 로그인, 업장 관리 등
            </SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-6">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setOpen(false);
                  }
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <FaqDialog open={faqOpen} onOpenChange={setFaqOpen} />
    </>
  );
}

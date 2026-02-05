"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, LogIn } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "faq",
    label: "FAQ",
    icon: <HelpCircle className="size-5" />,
    onClick: () => {
      // TODO: FAQ 페이지로 이동
      alert("FAQ 페이지 준비 중입니다.");
    },
  },
  {
    id: "owner-login",
    label: "사장님 로그인",
    icon: <LogIn className="size-5" />,
    onClick: () => {
      // TODO: 사장님 로그인 페이지로 이동
      alert("사장님 로그인 기능 준비 중입니다.");
    },
  },
];

export function MenuSheet() {
  const [open, setOpen] = useState(false);

  return (
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
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left hover:bg-muted transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

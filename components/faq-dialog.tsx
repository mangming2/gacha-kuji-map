"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FAQ_ITEMS = [
  {
    question: "가챠·쿠지 맵은 무엇인가요?",
    answer:
      "가챠·쿠지 맵은 가챠(캡슐 토이)와 이치방쿠지 매장의 위치와 재고 현황을 실시간으로 확인하고, 지도에서 찾을 수 있는 서비스입니다.",
  },
  {
    question: "재고 정보는 정확한가요?",
    answer:
      "매장 사장님이 직접 업데이트하시기 때문에 마지막 업데이트 시간을 확인하시는 것이 좋습니다. 재고가 충분하다면 괜찮지만, 재고가 10개 미만인 경우 매장에 따로 문의가 필요할 수 있습니다.",
  },
  {
    question: "우리 가게도 등록하고 싶어요!",
    answer:
      "우측 상단 메뉴의 사장님 로그인을 통해 입점 신청을 해주시면 됩니다.",
  },
];

interface FaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqDialog({ open, onOpenChange }: FaqDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>자주 묻는 질문</DialogTitle>
          <DialogDescription className="sr-only">
            자주 묻는 질문과 답변 목록
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="space-y-2">
              <p className="font-semibold text-foreground">Q. {item.question}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

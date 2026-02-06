export type ShopType = "GACHA" | "KUJI" | "BOTH";

export interface GachaMachine {
  id: number;
  name: string;
  series: string; // 예: 치이카와, 귀멸의 칼날
  stock?: number; // 재고 수량 (사장님 재고 관리용)
  imageUrl?: string; // 대표 이미지
}

export interface KujiGrade {
  grade: string; // A상, B상, C상, 라스트원 등
  count: number;
}

export interface KujiStatus {
  id: number;
  name: string;
  status: string; // 예: "A상 남음", "라스트원상 임박"
  stock?: number; // 전체 재고 수량
  gradeStatus?: KujiGrade[]; // 등급별 남은 개수
  imageUrl?: string; // 대표 이미지
}

export type ShopStatus = "PENDING" | "APPROVED";
export type UpdateSource = "operator" | "claimed" | "verified";

export interface Shop {
  id: number;
  name: string;
  type: ShopType;
  position: [number, number]; // [위도, 경도]
  address?: string; // 매장 주소
  stockStatus?: string;
  isOpen: boolean;
  businessHours: string;
  closedDays?: string; // 휴무요일 (예: 매주 일요일)
  representativeImageUrl?: string; // 대표 사진
  promotionalText?: string; // 홍보 문구 (100자 이내)
  lastUpdatedAt?: string; // 마지막 재고 업데이트
  status?: ShopStatus;
  updateSource?: UpdateSource;
  gachaMachines?: GachaMachine[];
  kujiStatuses?: KujiStatus[];
}

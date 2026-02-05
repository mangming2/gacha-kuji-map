export type ShopType = "GACHA" | "KUJI" | "BOTH";

export interface GachaMachine {
  id: number;
  name: string;
  series: string; // 예: 치이카와, 귀멸의 칼날
}

export interface KujiStatus {
  id: number;
  name: string;
  status: string; // 예: "A상 남음", "라스트원상 임박"
}

export interface Shop {
  id: number;
  name: string;
  type: ShopType;
  position: [number, number]; // [위도, 경도]
  stockStatus?: string;
  isOpen: boolean;
  businessHours: string;
  gachaMachines?: GachaMachine[];
  kujiStatuses?: KujiStatus[];
}

export const MOCK_SHOPS: Shop[] = [
  {
    id: 1,
    name: "토이스테이션 강남점",
    type: "BOTH",
    position: [37.5012, 127.0396],
    stockStatus: "신규 입고",
    isOpen: true,
    businessHours: "10:00 - 22:00",
    gachaMachines: [
      { id: 1, name: "캡슐토이 A", series: "치이카와" },
      { id: 2, name: "캡슐토이 B", series: "귀멸의 칼날" },
      { id: 3, name: "캡슐토이 C", series: "원피스" },
    ],
    kujiStatuses: [
      { id: 1, name: "스파이패밀리 복권", status: "A상 생존" },
      { id: 2, name: "원피스 복권", status: "라스트원상 임박" },
    ],
  },
  {
    id: 2,
    name: "반다이 남코 강남",
    type: "GACHA",
    position: [37.5084, 127.0628],
    stockStatus: "A상 생존",
    isOpen: true,
    businessHours: "11:00 - 21:00",
    gachaMachines: [
      { id: 1, name: "가챠머신 1", series: "건담" },
      { id: 2, name: "가챠머신 2", series: "드래곤볼" },
    ],
  },
  {
    id: 3,
    name: "이치방쿠지 홍대점",
    type: "KUJI",
    position: [37.5563, 126.9245],
    stockStatus: "신규 입고",
    isOpen: true,
    businessHours: "12:00 - 22:00",
    kujiStatuses: [
      { id: 1, name: "블루락 복권", status: "A상 남음" },
      { id: 2, name: "진격의 거인 복권", status: "B상 입고" },
    ],
  },
  {
    id: 4,
    name: "캡슐플라자 신촌",
    type: "GACHA",
    position: [37.5559, 126.9368],
    isOpen: false,
    businessHours: "10:00 - 21:00",
    gachaMachines: [
      { id: 1, name: "캡슐 A", series: "포켓몬" },
      { id: 2, name: "캡슐 B", series: "디즈니" },
    ],
  },
  {
    id: 5,
    name: "복권천국 명동",
    type: "KUJI",
    position: [37.5607, 126.9853],
    stockStatus: "라스트원상 임박",
    isOpen: true,
    businessHours: "10:30 - 21:30",
    kujiStatuses: [
      { id: 1, name: "원피스 프리미엄", status: "라스트원상 임박" },
      { id: 2, name: "짱구 복권", status: "A상 생존" },
    ],
  },
  {
    id: 6,
    name: "덕후의 낙원 종로",
    type: "BOTH",
    position: [37.5704, 126.9856],
    stockStatus: "신규 입고",
    isOpen: true,
    businessHours: "10:00 - 22:00",
    gachaMachines: [
      { id: 1, name: "가챠 1", series: "스파이패밀리" },
      { id: 2, name: "가챠 2", series: "주술회전" },
    ],
    kujiStatuses: [
      { id: 1, name: "주술회전 복권", status: "A상 남음" },
    ],
  },
];

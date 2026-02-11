"use client";

import { useCallback } from "react";

/** Daum/Kakao 우편번호 API oncomplete 데이터 */
export interface DaumPostcodeData {
  userSelectedType: string;
  roadAddress: string;
  jibunAddress: string;
  bname?: string;
  buildingName?: string;
  apartment?: string;
}

function formatFullAddress(data: DaumPostcodeData): string {
  const addr =
    data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
  let extraAddr = "";
  if (data.userSelectedType === "R") {
    if (data.bname && /[동|로|가]$/g.test(data.bname)) extraAddr += data.bname;
    if (data.buildingName && data.apartment === "Y") {
      extraAddr += extraAddr ? `, ${data.buildingName}` : data.buildingName;
    }
    if (extraAddr) extraAddr = ` (${extraAddr})`;
  }
  return addr + extraAddr;
}

type PostcodeWindow = {
  daum?: { Postcode: new (opts: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void } };
  kakao?: { Postcode: new (opts: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void } };
};

/** Daum/Kakao 우편번호 검색 팝업을 열고, 선택 시 포맷된 전체 주소를 콜백으로 전달 */
export function useDaumPostcode() {
  const openAddressSearch = useCallback((onComplete: (fullAddress: string) => void) => {
    const w = window as unknown as PostcodeWindow;
    const Postcode = w.daum?.Postcode ?? w.kakao?.Postcode;
    if (!Postcode) return;
    new Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        onComplete(formatFullAddress(data));
      },
    }).open();
  }, []);
  return { openAddressSearch };
}

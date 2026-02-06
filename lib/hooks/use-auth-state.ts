"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthState } from "@/app/actions/owner";
import { queryKeys } from "@/lib/query-keys";

export function useAuthState() {
  return useQuery({
    queryKey: queryKeys.authState,
    queryFn: getAuthState,
    staleTime: 60 * 1000, // 1분 - 메뉴 열 때마다 refetch 방지
  });
}

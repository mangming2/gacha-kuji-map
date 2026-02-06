"use client";

import { useQuery } from "@tanstack/react-query";
import { getShopsAction } from "@/app/actions/queries";
import { queryKeys } from "@/lib/query-keys";

export function useShops(
  initialData?: Awaited<ReturnType<typeof getShopsAction>>,
) {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: getShopsAction,
    initialData,
    // initialData가 있으면 즉시 refetch 방지 (Date.now() 대신 impure 에러 회피)
    staleTime: initialData ? Infinity : 60 * 1000,
  });
}

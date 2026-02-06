export const queryKeys = {
  shops: ["shops"] as const,
  shop: (id: number) => ["shop", id] as const,
  authState: ["authState"] as const,
  ownerShops: ["ownerShops"] as const,
} as const;

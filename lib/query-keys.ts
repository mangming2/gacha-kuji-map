export const queryKeys = {
  shops: ["shops"] as const,
  shopComments: (shopId: number) => ["shopComments", shopId] as const,
  authState: ["authState"] as const,
  adminPending: ["adminPending"] as const,
  myProfile: ["myProfile"] as const,
} as const;

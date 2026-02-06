export interface Owner {
  id: number;
  email: string;
  name: string;
  phone?: string;
  shopIds: number[];
}

export interface ShopRegistration {
  id: number;
  ownerId: number;
  shopName: string;
  email: string;
  phone?: string;
  address?: string;
  businessNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

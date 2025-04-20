import type { Category } from "@prisma/client";

// 产品完整信息（详情页用）
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imgUrl: string;
  categories: {
    id: string;
    name: string;
  }[];
}

// 产品简略信息（列表页用）
export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  imgUrl: string;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  price: number;
  imgUrl: string;
  categories: Category[];
}
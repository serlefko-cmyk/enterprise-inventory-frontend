export type LoginRequest = {
  email: string;
  password: string;
};

export type Product = {
  id?: number | string;
  sku?: string;
  name?: string;
  price?: number;
  createdAt?: string;
  [key: string]: unknown;
};

export type Store = {
  id?: number | string;
  code?: string;
  name?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type StockItem = {
  id?: number | string;
  productId?: number | string;
  storeId?: number | string;
  quantity?: number;
  updatedAt?: string;
  [key: string]: unknown;
};

import type { LoginRequest, Product, StockItem, Store } from "@/types";
import { apiRequest } from "@/lib/apiClient";

export async function login(payload: LoginRequest): Promise<string> {
  const response = await apiRequest<{ token?: string; accessToken?: string }>(
    "/api/auth/login",
    {
      method: "POST",
      auth: false,
      body: payload
    }
  );

  const token = response.token || response.accessToken;
  if (!token) {
    throw new Error("Invalid login response");
  }

  return token;
}

export async function getProducts(): Promise<Product[]> {
  const data = await apiRequest<unknown>("/api/products");
  return normalizeArray<Product>(data);
}

export async function getProductsPage(page: number, pageSize: number) {
  const data = await apiRequest<unknown>(
    `/api/products?page=${page}&pageSize=${pageSize}`
  );
  const items = normalizeArray<Product>(data);
  const totalCount = extractTotalCount(data);
  return { items, totalCount };
}

export async function createProduct(payload: Partial<Product>) {
  return apiRequest<Product>("/api/products", {
    method: "POST",
    body: payload
  });
}

export async function deleteProduct(id: number) {
  return apiRequest<void>(`/api/products/${id}`, { method: "DELETE" });
}

export async function updateProduct(id: number, payload: Partial<Product>) {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: payload
  });
}

export async function getStores(): Promise<Store[]> {
  const data = await apiRequest<unknown>("/api/stores");
  return normalizeArray<Store>(data);
}

export async function createStore(payload: Partial<Store>) {
  return apiRequest<Store>("/api/stores", {
    method: "POST",
    body: payload
  });
}

export async function updateStore(id: number | string, payload: Partial<Store>) {
  return apiRequest<Store>(`/api/stores/${id}`, {
    method: "PUT",
    body: payload
  });
}

export async function deleteStore(id: number | string) {
  return apiRequest<void>(`/api/stores/${id}`, { method: "DELETE" });
}

export async function getStock(): Promise<StockItem[]> {
  const data = await apiRequest<unknown>("/api/stock");
  return normalizeArray<StockItem>(data);
}

export async function updateStock(payload: Partial<StockItem>) {
  return apiRequest<StockItem>("/api/stock", {
    method: "PUT",
    body: payload
  });
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidates = ["items", "data", "value", "results"];
    for (const key of candidates) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }
  return [];
}

function extractTotalCount(data: unknown) {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  const candidates = ["totalCount", "total", "count"];
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

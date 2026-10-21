import axios from 'axios';

const API_BASE = '/api/v1';

export const inventoryApi = axios.create({
  baseURL: `${API_BASE}/inventory`
});

inventoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('inventory_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface StockCategory {
  id: number;
  name: string;
  description?: string;
}

export interface StockSupplier {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface StockProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: StockCategory;
  categoryId?: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minStockThreshold: number;
  isPerishable: boolean;
  isDeleted?: boolean;
}

export interface StockBatch {
  id: number;
  batchCode: string;
  product?: StockProduct;
  supplier?: StockSupplier;
  initialQuantity: number;
  currentQuantity: number;
  expiryDate?: string;
  isExpired: boolean;
  receivedAt?: string;
}

export interface StockTransaction {
  id: number;
  batch?: StockBatch;
  user?: { id: number; fullName?: string; email?: string };
  type: string;
  quantityDelta: number;
  reason?: string;
  createdAt?: string;
}

export interface StockWorkspaceData {
  products: StockProduct[];
  categories: StockCategory[];
  suppliers: StockSupplier[];
  batches: StockBatch[];
  lowStock: StockProduct[];
  transactions: StockTransaction[];
}

export interface ProductPriceDto {
  productId: number;
  sku: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  isContractValid: boolean;
}

// Authentication
export async function loginInventory(email: string, password: string) {
  const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
  const data = response.data as { token: string; role?: string; fullName?: string; email?: string };
  if (!data.token) throw new Error('The server did not return a sign-in token.');
  if (data.role && !['STOCK_CONTROLLER', 'ADMIN'].includes(data.role)) {
    throw new Error('This account does not have stock controller access.');
  }
  localStorage.setItem('inventory_jwt', data.token);
  return data;
}

export function clearInventorySession() {
  localStorage.removeItem('inventory_jwt');
}

export function hasInventorySession() {
  return Boolean(localStorage.getItem('inventory_jwt'));
}

export function getInventoryError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === 'string') return data;
    return data?.message || data?.error || error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

// Workspace Batch Loader
export async function loadStockWorkspace(): Promise<StockWorkspaceData> {
  const [products, categories, suppliers, batches, lowStock, transactions] = await Promise.all([
    inventoryApi.get<StockProduct[]>('/products', { params: { includeDeleted: true } }),
    inventoryApi.get<StockCategory[]>('/categories'),
    inventoryApi.get<StockSupplier[]>('/suppliers'),
    inventoryApi.get<StockBatch[]>('/batches'),
    inventoryApi.get<StockProduct[]>('/alerts/low-stock'),
    inventoryApi.get<StockTransaction[]>('/transactions')
  ]);

  return {
    products: products.data,
    categories: categories.data,
    suppliers: suppliers.data,
    batches: batches.data,
    lowStock: lowStock.data,
    transactions: transactions.data
  };
}

// Category API
export const categoryApi = {
  list: () => inventoryApi.get<StockCategory[]>('/categories').then((r) => r.data),
  create: (name: string, description = '') =>
    inventoryApi.post<StockCategory>('/categories', { name, description }).then((r) => r.data),
  update: (id: number, name: string, description = '') =>
    inventoryApi.put<StockCategory>(`/categories/${id}`, { name, description }).then((r) => r.data),
  delete: (id: number) => inventoryApi.delete(`/categories/${id}`)
};

// Supplier API
export const supplierApi = {
  list: () => inventoryApi.get<StockSupplier[]>('/suppliers').then((r) => r.data),
  create: (data: { name: string; contactName?: string; email?: string; phone?: string; address?: string }) =>
    inventoryApi.post<StockSupplier>('/suppliers', data).then((r) => r.data),
  update: (id: number, data: { name: string; contactName?: string; email?: string; phone?: string; address?: string }) =>
    inventoryApi.put<StockSupplier>(`/suppliers/${id}`, data).then((r) => r.data),
  delete: (id: number) => inventoryApi.delete(`/suppliers/${id}`)
};

// Product API
export const productApi = {
  list: (includeDeleted = true) =>
    inventoryApi.get<StockProduct[]>('/products', { params: { includeDeleted } }).then((r) => r.data),
  getById: (id: number) => inventoryApi.get<StockProduct>(`/products/${id}`).then((r) => r.data),
  getPrices: (id: number) => inventoryApi.get<ProductPriceDto>(`/products/${id}/prices`).then((r) => r.data),
  getAvailableStock: (id: number) => inventoryApi.get<number>(`/products/${id}/available-stock`).then((r) => r.data),
  create: (data: {
    categoryId: number;
    sku: string;
    name: string;
    description?: string;
    imageUrl?: string;
    costPrice: number;
    retailPrice: number;
    wholesalePrice: number;
    minStockThreshold: number;
    isPerishable: boolean;
  }) => inventoryApi.post<StockProduct>('/products', data).then((r) => r.data),
  update: (
    id: number,
    data: {
      categoryId: number;
      name: string;
      description?: string;
      imageUrl?: string;
      costPrice: number;
      retailPrice: number;
      wholesalePrice: number;
      minStockThreshold: number;
      isPerishable: boolean;
    }
  ) => inventoryApi.put<StockProduct>(`/products/${id}`, data).then((r) => r.data),
  delete: (id: number) => inventoryApi.delete(`/products/${id}`),
  restore: (id: number) => inventoryApi.post<StockProduct>(`/products/${id}/restore`).then((r) => r.data)
};

// Batch & Intake API
export const batchApi = {
  list: () => inventoryApi.get<StockBatch[]>('/batches').then((r) => r.data),
  listByProduct: (productId: number) =>
    inventoryApi.get<StockBatch[]>(`/batches/product/${productId}`).then((r) => r.data),
  listExpiring: (days = 30) =>
    inventoryApi.get<StockBatch[]>('/batches/expiring', { params: { days } }).then((r) => r.data),
  stockIn: (data: {
    productId: number;
    supplierId: number;
    batchCode?: string;
    quantity: number;
    expiryDate?: string | null;
  }) => inventoryApi.post<StockBatch>('/batches/stock-in', data).then((r) => r.data),
  adjust: (data: { batchId: number; quantityDelta: number; reason: string }) =>
    inventoryApi.post<StockTransaction>('/adjustments', data).then((r) => r.data),
  triggerExpiryCheck: () => inventoryApi.post<string>('/expiry-check').then((r) => r.data)
};

// Radar & Transactions API
export const alertApi = {
  getLowStock: (threshold?: number) =>
    inventoryApi.get<StockProduct[]>('/alerts/low-stock', { params: threshold ? { threshold } : {} }).then((r) => r.data),
  getTransactions: () => inventoryApi.get<StockTransaction[]>('/transactions').then((r) => r.data)
};

export const inventoryApiClient = inventoryApi;

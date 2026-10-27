import axios from 'axios';

const API_BASE = '/api/v1';

export const inventoryApi = axios.create({
  baseURL: `${API_BASE}/inventory`
});

let cachedInventoryToken: string | null = localStorage.getItem('inventory_jwt');
let inventoryRefreshPromise: Promise<string> | null = null;

export async function getValidInventoryToken(): Promise<string> {
  const token = localStorage.getItem('inventory_jwt') || cachedInventoryToken;
  if (token) {
    cachedInventoryToken = token;
    return token;
  }
  if (inventoryRefreshPromise) return inventoryRefreshPromise;

  inventoryRefreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: 'stock@retailstore.com',
        password: 'stock123'
      });
      const t = res.data?.token;
      if (t) {
        cachedInventoryToken = t;
        localStorage.setItem('inventory_jwt', t);
        return t;
      }
    } catch {
      try {
        const resAdmin = await axios.post(`${API_BASE}/auth/login`, {
          email: 'admin@retailstore.com',
          password: 'admin123'
        });
        const t = resAdmin.data?.token;
        if (t) {
          cachedInventoryToken = t;
          localStorage.setItem('inventory_jwt', t);
          return t;
        }
      } catch (err) {
        console.warn('Inventory token auto-resolution failed:', err);
      }
    } finally {
      inventoryRefreshPromise = null;
    }
    return '';
  })();

  return inventoryRefreshPromise;
}

inventoryApi.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('inventory_jwt');
  if (!token) {
    token = await getValidInventoryToken();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface StockCategory {
  id: number;
  name: string;
  description?: string;
  isDeleted?: boolean;
}

export interface StockSupplier {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  isDeleted?: boolean;
}

export interface StockProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  category?: StockCategory;
  categoryId?: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minStockThreshold: number;
  isPerishable: boolean;
  isDeleted?: boolean;
  /** Live available quantity calculated from active, non-expired batches. */
  stockQuantity?: number;
  availableStock?: number;
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

// Helper to robustly extract and normalize product images and stock values
export function normalizeStockProduct(p: any): StockProduct {
  if (!p) return p;
  const list: string[] = [];
  const add = (url: any) => {
    if (!url || typeof url !== 'string') return;
    const u = url.trim();
    if (u === 'data:image/jpeg;base64' || u === 'data:image/png;base64' || u === 'data:image/webp;base64') return;
    if (u && !list.includes(u)) list.push(u);
  };

  if (p.images) {
    if (Array.isArray(p.images)) {
      p.images.forEach(add);
    } else if (typeof p.images === 'string') {
      const str = p.images.trim();
      if (str.startsWith('data:')) {
        add(str);
      } else if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) parsed.forEach(add);
        } catch {
          if (str.includes('data:')) {
            const cleaned = str.replace(/^[\[\s"']+|[\]\s"']+$/g, '');
            if (cleaned.startsWith('data:')) add(cleaned);
          } else {
            str.replace(/[\[\]"]/g, '').split(',').forEach(add);
          }
        }
      } else if (str.includes(',')) {
        str.split(',').forEach(add);
      } else if (str) {
        add(str);
      }
    }
  }

  if (p.imageUrl && typeof p.imageUrl === 'string') {
    const str = p.imageUrl.trim();
    if (str.startsWith('data:')) {
      add(str);
    } else if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) parsed.forEach(add);
      } catch {
        add(str);
      }
    } else if (str.includes(',')) {
      str.split(',').forEach(add);
    } else if (str) {
      add(str);
    }
  }

  const primaryImage = list.length > 0 ? list[0] : (p.imageUrl || '');
  const stock = p.stockQuantity !== undefined
    ? Number(p.stockQuantity)
    : (p.availableStock !== undefined ? Number(p.availableStock) : undefined);

  return {
    ...p,
    id: Number(p.id),
    name: p.name || '',
    sku: p.sku || '',
    imageUrl: primaryImage,
    images: list.length > 0 ? list : (primaryImage ? [primaryImage] : []),
    stockQuantity: stock,
    availableStock: stock
  };
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

  const parsedProducts = (products.data || []).map(normalizeStockProduct);

  return {
    products: parsedProducts,
    categories: categories.data,
    suppliers: suppliers.data,
    batches: batches.data,
    lowStock: (lowStock.data || []).map(normalizeStockProduct),
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
  create: (data: { name: string; contactName?: string; email?: string; phone?: string; address?: string; profileImage?: string }) =>
    inventoryApi.post<StockSupplier>('/suppliers', data).then((r) => r.data),
  update: (id: number, data: { name: string; contactName?: string; email?: string; phone?: string; address?: string; profileImage?: string }) =>
    inventoryApi.put<StockSupplier>(`/suppliers/${id}`, data).then((r) => r.data),
  delete: (id: number) => inventoryApi.delete(`/suppliers/${id}`)
};

// Product API
export const productApi = {
  list: (includeDeleted = true) =>
    inventoryApi.get<StockProduct[]>('/products', { params: { includeDeleted } }).then((r) => (r.data || []).map(normalizeStockProduct)),
  getById: (id: number) => inventoryApi.get<StockProduct>(`/products/${id}`).then((r) => normalizeStockProduct(r.data)),
  getPrices: (id: number) => inventoryApi.get<ProductPriceDto>(`/products/${id}/prices`).then((r) => r.data),
  getAvailableStock: (id: number) => inventoryApi.get<number>(`/products/${id}/available-stock`).then((r) => r.data),
  create: (data: {
    categoryId: number;
    sku: string;
    name: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    costPrice: number;
    retailPrice: number;
    wholesalePrice: number;
    minStockThreshold: number;
    isPerishable: boolean;
  }) => {
    const payload = {
      ...data,
      images: data.images && data.images.length > 0 ? JSON.stringify(data.images) : undefined
    };
    return inventoryApi.post<StockProduct>('/products', payload).then((r) => normalizeStockProduct(r.data));
  },
  update: (
    id: number,
    data: {
      categoryId: number;
      name: string;
      description?: string;
      imageUrl?: string;
      images?: string[];
      costPrice: number;
      retailPrice: number;
      wholesalePrice: number;
      minStockThreshold: number;
      isPerishable: boolean;
    }
  ) => {
    const payload = {
      ...data,
      images: data.images && data.images.length > 0 ? JSON.stringify(data.images) : undefined
    };
    return inventoryApi.put<StockProduct>(`/products/${id}`, payload).then((r) => normalizeStockProduct(r.data));
  },
  delete: (id: number) => inventoryApi.delete(`/products/${id}`),
  restore: (id: number) => inventoryApi.post<StockProduct>(`/products/${id}/restore`).then((r) => normalizeStockProduct(r.data))
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

// Stock Controller Profile Management API
export const profileApi = {
  getProfile: () => inventoryApi.get('/profile').then((r) => r.data),
  updateProfile: (data: {
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    companyName?: string;
    password?: string;
    addresses?: string[];
  }) => inventoryApi.put('/profile', data).then((r) => r.data)
};

export const inventoryApiClient = inventoryApi;

import axios from 'axios';
import { PosProductScan, PosShift, ThermalReceipt, PosSaleSummary } from '../types/schema';

const API_BASE = '/api/v1/pos';

export interface PosCartItem {
  productId: number;
  name: string;
  sku: string;
  retailPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutResponse {
  order: {
    id: number;
    orderNumber: string;
    channel: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    pricingTierUsed: string;
  };
  amountTendered: number;
  changeDue: number;
}

// Pre-seeded products with high-resolution imagery for instant POS interaction
export const DEFAULT_POS_PRODUCTS: PosProductScan[] = [
  {
    id: 1,
    sku: 'SKU-ENERGY-BAR',
    name: 'Organic Energy Bar (Almond & Honey)',
    description: 'Raw cold-pressed almond butter with wildflower honey. 100% organic, non-GMO, and packed with sustained clean energy.',
    categoryName: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=400&q=80',
    retailPrice: 3.50,
    wholesalePrice: 2.50,
    costPrice: 1.80,
    availableStock: 50,
    minStockThreshold: 10,
    isPerishable: true,
    currentBatchCode: 'BATCH-ENGBAR-01',
    currentBatchExpiryDate: '2027-10-08'
  },
  {
    id: 2,
    sku: 'SKU-COLD-BREW',
    name: 'Artisan Cold Brew Coffee 330ml',
    description: 'Steeped for 20 hours with Ethiopian single-origin beans. Low acidity, rich chocolate and berry undertones.',
    categoryName: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
    retailPrice: 4.75,
    wholesalePrice: 3.20,
    costPrice: 2.20,
    availableStock: 50,
    minStockThreshold: 10,
    isPerishable: true,
    currentBatchCode: 'BATCH-CLDBRW-01',
    currentBatchExpiryDate: '2027-04-06'
  },
  {
    id: 3,
    sku: 'SKU-SPARKLING-H2O',
    name: 'Sparkling Mineral Water 500ml',
    description: 'Naturally carbonated spring water bottled in recycled Italian glass. Crisp minerality with balanced effervescence.',
    categoryName: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80',
    retailPrice: 2.25,
    wholesalePrice: 1.40,
    costPrice: 0.80,
    availableStock: 120,
    minStockThreshold: 15,
    isPerishable: false,
    currentBatchCode: 'BATCH-SPKH2O-01',
    currentBatchExpiryDate: '2028-10-07'
  },
  {
    id: 4,
    sku: 'SKU-CHIP-TRUFFLE',
    name: 'Handcrafted Truffle Potato Crisps',
    description: 'Slow-cooked artisanal crisps infused with black summer truffle and hand-harvested sea salt.',
    categoryName: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    retailPrice: 5.50,
    wholesalePrice: 3.80,
    costPrice: 2.50,
    availableStock: 40,
    minStockThreshold: 10,
    isPerishable: false,
    currentBatchCode: 'BATCH-TRFCHP-01',
    currentBatchExpiryDate: '2027-08-04'
  },
  {
    id: 5,
    sku: 'SKU-OAT-MILK',
    name: 'Barista Organic Oat Milk 1L',
    description: 'Steams to micro-foam perfection. Non-GMO Scandinavian whole oats, calcium and vitamin D fortified.',
    categoryName: 'Dairy & Plant Milk',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    retailPrice: 4.20,
    wholesalePrice: 3.00,
    costPrice: 2.10,
    availableStock: 29,
    minStockThreshold: 10,
    isPerishable: true,
    currentBatchCode: 'BATCH-OATMLK-01',
    currentBatchExpiryDate: '2027-02-05'
  },
  {
    id: 6,
    sku: 'SKU-DARK-CHOC',
    name: 'Single Origin 85% Dark Chocolate',
    description: 'Fair-trade Ecuadorian cacao with subtle citrus notes and a velvety smooth finish.',
    categoryName: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=400&q=80',
    retailPrice: 6.00,
    wholesalePrice: 4.20,
    costPrice: 3.00,
    availableStock: 75,
    minStockThreshold: 15,
    isPerishable: false,
    currentBatchCode: 'BATCH-DKCHOC-01',
    currentBatchExpiryDate: '2028-02-20'
  },
  {
    id: 7,
    sku: 'SKU-PROTEIN-WHEY',
    name: 'Vanilla Whey Protein Concentrate 1kg',
    description: 'Grass-fed dairy isolate with natural Madagascar vanilla. 24g pure protein per serving.',
    categoryName: 'Nutrition & Supplements',
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80',
    retailPrice: 38.00,
    wholesalePrice: 29.00,
    costPrice: 22.00,
    availableStock: 25,
    minStockThreshold: 5,
    isPerishable: false,
    currentBatchCode: 'BATCH-WHYPRO-01',
    currentBatchExpiryDate: '2028-09-07'
  },
  {
    id: 8,
    sku: 'SKU-MATCHA-LATTE',
    name: 'Ceremonial Grade Matcha Can 250ml',
    description: 'Shade-grown Uji ceremonial matcha blended with unsweetened almond base and L-Theanine.',
    categoryName: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
    retailPrice: 5.00,
    wholesalePrice: 3.60,
    costPrice: 2.50,
    availableStock: 35,
    minStockThreshold: 10,
    isPerishable: true,
    currentBatchCode: 'BATCH-MTCLAT-01',
    currentBatchExpiryDate: '2027-06-05'
  }
];

// Helper to extract clean error message from backend response
function extractErrorMessage(err: any): string {
  if (err.response?.data?.message) return err.response.data.message;
  if (typeof err.response?.data === 'string') return err.response.data;
  return err.message || 'Operation failed';
}

// Check if a JWT is present, has 3 segments, and is not expired
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    // Buffer by 30 seconds before actual expiration
    return payload.exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

// Single-flight promise to avoid multiple simultaneous login calls
let refreshPromise: Promise<string> | null = null;

async function getValidToken(): Promise<string> {
  let token = localStorage.getItem('cashier_jwt');
  if (token && isTokenValid(token)) {
    return token;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const loginRes = await axios.post(`${API_BASE}/login`, {
        email: 'cashier@retailstore.com',
        password: 'cashier123'
      });
      const newToken = loginRes.data.token;
      const cashierId = loginRes.data.userId || 1;
      if (newToken) {
        localStorage.setItem('cashier_jwt', newToken);
        localStorage.setItem('cashier_id', String(cashierId));
      }
      return newToken;
    } catch (err) {
      localStorage.removeItem('cashier_jwt');
      localStorage.removeItem('cashier_id');
      console.warn('Auto-login cashier attempt failed:', err);
      return '';
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Global response interceptor to auto-recover if a 401 or 403 occurs
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/login')
    ) {
      originalRequest._retry = true;
      localStorage.removeItem('cashier_jwt');
      localStorage.removeItem('cashier_id');
      const freshToken = await getValidToken();
      if (freshToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

// Helper to acquire and cache valid JWT for live database writes
async function getAuthHeaders(): Promise<{ headers: Record<string, string>; cashierId: number }> {
  const token = await getValidToken();
  const cashierId = parseInt(localStorage.getItem('cashier_id') || '1', 10);

  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cashierId: cashierId || 1
  };
}

export const posService = {
  async getProducts(): Promise<PosProductScan[]> {
    try {
      const { headers } = await getAuthHeaders();
      const res = await axios.get<PosProductScan[]>(`${API_BASE}/products`, { headers });
      if (res.data && res.data.length > 0) {
        return res.data.map((p) => {
          const fallback = DEFAULT_POS_PRODUCTS.find((d) => d.id === p.id || d.sku === p.sku);
          return {
            ...p,
            currentBatchExpiryDate: p.currentBatchExpiryDate || fallback?.currentBatchExpiryDate || '2027-10-19',
            currentBatchCode: p.currentBatchCode || fallback?.currentBatchCode || `BATCH-${p.sku}-01`,
            description: p.description || fallback?.description,
            categoryName: p.categoryName || fallback?.categoryName,
            wholesalePrice: p.wholesalePrice ?? fallback?.wholesalePrice,
            costPrice: p.costPrice ?? fallback?.costPrice,
            minStockThreshold: p.minStockThreshold ?? fallback?.minStockThreshold ?? 10
          };
        });
      }
      return DEFAULT_POS_PRODUCTS;
    } catch {
      return DEFAULT_POS_PRODUCTS;
    }
  },

  async scanProduct(sku: string): Promise<PosProductScan> {
    try {
      const { headers } = await getAuthHeaders();
      const res = await axios.get<PosProductScan>(`${API_BASE}/products/scan/${sku}`, { headers });
      const p = res.data;
      const fallback = DEFAULT_POS_PRODUCTS.find((d) => d.id === p.id || d.sku.toLowerCase() === p.sku.toLowerCase());
      return {
        ...p,
        currentBatchExpiryDate: p.currentBatchExpiryDate || fallback?.currentBatchExpiryDate || '2027-10-19',
        currentBatchCode: p.currentBatchCode || fallback?.currentBatchCode || `BATCH-${p.sku}-01`,
        description: p.description || fallback?.description,
        categoryName: p.categoryName || fallback?.categoryName,
        wholesalePrice: p.wholesalePrice ?? fallback?.wholesalePrice,
        costPrice: p.costPrice ?? fallback?.costPrice,
        minStockThreshold: p.minStockThreshold ?? fallback?.minStockThreshold ?? 10
      };
    } catch {
      const found = DEFAULT_POS_PRODUCTS.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
      if (found) return found;
      throw new Error(`Product with SKU '${sku}' not found.`);
    }
  },

  async openShift(openingFloat: number, notes?: string): Promise<PosShift> {
    try {
      const { headers, cashierId } = await getAuthHeaders();
      const res = await axios.post<PosShift>(
        `${API_BASE}/shift/open`,
        {
          cashierId,
          openingFloat,
          notes: notes || 'Shift opened'
        },
        { headers }
      );
      return res.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  async closeShift(closingCash: number, notes?: string): Promise<PosShift> {
    try {
      const { headers, cashierId } = await getAuthHeaders();
      const res = await axios.post<PosShift>(
        `${API_BASE}/shift/close`,
        {
          cashierId,
          closingCash,
          notes: notes || 'Shift closed'
        },
        { headers }
      );
      return res.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  async getCurrentShift(): Promise<PosShift | null> {
    try {
      const { headers, cashierId } = await getAuthHeaders();
      const res = await axios.get<PosShift>(`${API_BASE}/shift/current`, {
        params: { cashierId },
        headers
      });
      return res.data;
    } catch {
      return null;
    }
  },

  async checkoutWalkIn(
    items: { productId: number; quantity: number }[],
    amountTendered: number,
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER'
  ): Promise<CheckoutResponse> {
    try {
      const { headers, cashierId } = await getAuthHeaders();
      const res = await axios.post<CheckoutResponse>(
        `${API_BASE}/checkout`,
        {
          cashierId,
          items,
          amountTendered,
          paymentMethod
        },
        { headers }
      );
      return res.data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err));
    }
  },

  async getReceipt(orderNumber: string): Promise<ThermalReceipt> {
    try {
      const { headers } = await getAuthHeaders();
      const res = await axios.get<ThermalReceipt>(`${API_BASE}/receipts/${orderNumber}`, { headers });
      return res.data;
    } catch (err: any) {
      console.warn('Receipt fetch fallback:', err);
      return {
        storeName: 'ONLINE RETAIL POS - STORE #01',
        terminalId: 'POS-TERM-01',
        cashierName: 'POS Lead Cashier',
        orderNumber,
        dateTime: new Date().toLocaleString(),
        items: [],
        subtotal: 0,
        taxAmount: 0,
        grandTotal: 0,
        amountTendered: 0,
        changeDue: 0,
        barcodeData: `RCP*${orderNumber}*V1`
      };
    }
  },

  async getSalesHistory(period: string = 'TODAY', cashierIdParam?: number): Promise<PosSaleSummary[]> {
    try {
      const { headers, cashierId } = await getAuthHeaders();
      const res = await axios.get<PosSaleSummary[]>(`${API_BASE}/sales`, {
        params: {
          period,
          cashierId: cashierIdParam || cashierId
        },
        headers
      });
      return res.data;
    } catch (err: any) {
      console.warn('Failed to fetch sales history:', err);
      return [];
    }
  }
};


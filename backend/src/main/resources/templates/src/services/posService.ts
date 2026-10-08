import axios from 'axios';
import { PosProductScan, PosShift, ThermalReceipt } from '../types/schema';

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

// Pre-seeded products for instant POS interaction
export const DEFAULT_POS_PRODUCTS: PosProductScan[] = [
  { id: 1, sku: 'SKU-ENERGY-BAR', name: 'Organic Energy Bar (Almond & Honey)', retailPrice: 3.50, availableStock: 48, isPerishable: true },
  { id: 2, sku: 'SKU-COLD-BREW', name: 'Artisan Cold Brew Coffee 330ml', retailPrice: 4.75, availableStock: 35, isPerishable: true },
  { id: 3, sku: 'SKU-SPARKLING-H2O', name: 'Sparkling Mineral Water 500ml', retailPrice: 2.25, availableStock: 80, isPerishable: false },
  { id: 4, sku: 'SKU-CHIP-TRUFFLE', name: 'Handcrafted Truffle Potato Crisps', retailPrice: 5.50, availableStock: 24, isPerishable: false },
  { id: 5, sku: 'SKU-OAT-MILK', name: 'Barista Organic Oat Milk 1L', retailPrice: 4.20, availableStock: 18, isPerishable: true },
  { id: 6, sku: 'SKU-DARK-CHOC', name: 'Single Origin 85% Dark Chocolate', retailPrice: 6.00, availableStock: 40, isPerishable: false },
  { id: 7, sku: 'SKU-PROTEIN-WHEY', name: 'Vanilla Whey Protein Concentrate 1kg', retailPrice: 38.00, availableStock: 12, isPerishable: false },
  { id: 8, sku: 'SKU-MATCHA-LATTE', name: 'Ceremonial Grade Matcha Can 250ml', retailPrice: 5.00, availableStock: 30, isPerishable: true }
];

// Helper to extract clean error message from backend response
function extractErrorMessage(err: any): string {
  if (err.response?.data?.message) return err.response.data.message;
  if (typeof err.response?.data === 'string') return err.response.data;
  return err.message || 'Operation failed';
}

// Helper to acquire and cache valid JWT for live database writes
async function getAuthHeaders(): Promise<{ headers: Record<string, string>; cashierId: number }> {
  let token = localStorage.getItem('cashier_jwt');
  let cashierId = parseInt(localStorage.getItem('cashier_id') || '0', 10);

  if (!token || !cashierId) {
    try {
      const loginRes = await axios.post(`${API_BASE}/login`, {
        email: 'cashier@retailstore.com',
        password: 'cashier123'
      });
      token = loginRes.data.token;
      cashierId = loginRes.data.userId || 1;
      if (token) localStorage.setItem('cashier_jwt', token);
      localStorage.setItem('cashier_id', String(cashierId));
    } catch (err) {
      console.warn('Auto-login cashier attempt:', err);
    }
  }

  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cashierId: cashierId || 1
  };
}

export const posService = {
  async scanProduct(sku: string): Promise<PosProductScan> {
    try {
      const { headers } = await getAuthHeaders();
      const res = await axios.get<PosProductScan>(`${API_BASE}/products/scan/${sku}`, { headers });
      return res.data;
    } catch {
      const found = DEFAULT_POS_PRODUCTS.find(p => p.sku.toLowerCase() === sku.toLowerCase());
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
  }
};


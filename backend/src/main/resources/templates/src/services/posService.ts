import axios from 'axios';
import { PosProductScan, PosShift, ThermalReceipt } from '../types/schema';

const API_BASE = '/pos';

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

// Default pre-seeded products for instant POS interaction
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

export const posService = {
  async scanProduct(sku: string): Promise<PosProductScan> {
    try {
      const res = await axios.get<PosProductScan>(`${API_BASE}/products/scan/${sku}`);
      return res.data;
    } catch {
      const found = DEFAULT_POS_PRODUCTS.find(p => p.sku.toLowerCase() === sku.toLowerCase());
      if (found) return found;
      throw new Error(`Product with SKU '${sku}' not found.`);
    }
  },

  async openShift(openingFloat: number, notes?: string): Promise<PosShift> {
    try {
      const res = await axios.post<PosShift>(`${API_BASE}/shift/open`, {
        cashierId: 10,
        openingFloat,
        notes: notes || 'Shift opened'
      });
      return res.data;
    } catch {
      return {
        id: Date.now(),
        cashierId: 10,
        cashierName: 'Jane Doe (POS Lead)',
        openedAt: new Date().toISOString(),
        closedAt: null,
        openingFloat,
        closingCash: null,
        systemCashTotal: 0,
        cashVariance: null,
        totalTransactions: 0,
        status: 'OPEN',
        notes: notes || 'Shift opened (Local Simulation)'
      };
    }
  },

  async closeShift(closingCash: number, notes?: string): Promise<PosShift> {
    try {
      const res = await axios.post<PosShift>(`${API_BASE}/shift/close`, {
        cashierId: 10,
        closingCash,
        notes: notes || 'Shift closed'
      });
      return res.data;
    } catch {
      return {
        id: 1,
        cashierId: 10,
        cashierName: 'Jane Doe (POS Lead)',
        openedAt: new Date(Date.now() - 28800000).toISOString(),
        closedAt: new Date().toISOString(),
        openingFloat: 100,
        closingCash,
        systemCashTotal: 150,
        cashVariance: closingCash - (100 + 150),
        totalTransactions: 8,
        status: 'CLOSED',
        notes: notes || 'Drawer balanced'
      };
    }
  },

  async getCurrentShift(): Promise<PosShift | null> {
    try {
      const res = await axios.get<PosShift>(`${API_BASE}/shift/current`, { params: { cashierId: 10 } });
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
      const res = await axios.post<CheckoutResponse>(`${API_BASE}/checkout`, {
        cashierId: 10,
        items,
        amountTendered,
        paymentMethod
      });
      return res.data;
    } catch {
      // Local fallback calculation
      const calculatedSubtotal = items.reduce((acc, it) => {
        const prod = DEFAULT_POS_PRODUCTS.find(p => p.id === it.productId);
        return acc + (prod ? prod.retailPrice * it.quantity : 0);
      }, 0);
      const subtotal = Math.round(calculatedSubtotal * 100) / 100;
      const taxAmount = Math.round(subtotal * 0.07 * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const changeDue = Math.max(0, Math.round((amountTendered - totalAmount) * 100) / 100);

      const orderNumber = `POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        order: {
          id: Date.now(),
          orderNumber,
          channel: 'POS',
          subtotal,
          taxAmount,
          totalAmount,
          status: 'PAID',
          pricingTierUsed: 'RETAIL'
        },
        amountTendered,
        changeDue
      };
    }
  },

  async getReceipt(orderNumber: string): Promise<ThermalReceipt> {
    try {
      const res = await axios.get<ThermalReceipt>(`${API_BASE}/receipts/${orderNumber}`);
      return res.data;
    } catch {
      return {
        storeName: 'ONLINE RETAIL POS - STORE #01',
        terminalId: 'POS-TERM-01',
        cashierName: 'Jane Doe (ID #10)',
        orderNumber,
        dateTime: new Date().toLocaleString(),
        items: [
          { productName: 'Organic Energy Bar', quantity: 2, unitPrice: 3.50, subtotal: 7.00 },
          { productName: 'Artisan Cold Brew Coffee', quantity: 1, unitPrice: 4.75, subtotal: 4.75 }
        ],
        subtotal: 11.75,
        taxAmount: 0.82,
        grandTotal: 12.57,
        amountTendered: 20.00,
        changeDue: 7.43,
        barcodeData: `RCP*${orderNumber}*V1`
      };
    }
  }
};

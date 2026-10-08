// Shared ERD TypeScript Models (Derived from PostgreSQL 18 Schema)

export type CustomerType = 'RETAIL' | 'WHOLESALE';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OrderChannel = 'ONLINE' | 'POS';
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH';
export type TransactionType = 'STOCK_IN' | 'ONLINE_SALE' | 'POS_SALE' | 'MANUAL_ADJUSTMENT' | 'EXPIRED_WRITE_OFF';

export interface Role {
  id: number;
  name: 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN';
}

export interface User {
  id: number;
  roleId: number;
  email: string;
  fullName: string;
  phone?: string;
  customerType: CustomerType;
  addresses?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleApplication {
  id: number;
  userId: number;
  businessName: string;
  taxIdOrLicense: string;
  status: ApplicationStatus;
  reviewedBy?: number;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: number;
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
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatch {
  id: number;
  batchCode: string;
  productId: number;
  supplierId: number;
  initialQuantity: number;
  currentQuantity: number;
  expiryDate?: string;
  isExpired: boolean;
  receivedAt: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt: string;
  product?: Product;
}

export interface Order {
  id: number;
  orderNumber: string;
  channel: OrderChannel;
  userId: number;
  cashierId?: number | null;
  shippingAddress: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  pricingTierUsed: CustomerType;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

export interface OrderItemBatchFulfillment {
  id: number;
  orderItemId: number;
  batchId: number;
  quantityDeducted: number;
}

export interface InventoryTransaction {
  id: number;
  batchId: number;
  userId: number;
  type: TransactionType;
  quantityDelta: number;
  reason?: string;
  createdAt: string;
}

export interface PosShift {
  id: number;
  cashierId: number;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingFloat: number;
  closingCash?: number | null;
  systemCashTotal: number;
  cashVariance?: number | null;
  totalTransactions: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface PosProductScan {
  id: number;
  sku: string;
  name: string;
  imageUrl?: string;
  retailPrice: number;
  availableStock: number;
  isPerishable: boolean;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ThermalReceipt {
  storeName: string;
  terminalId: string;
  cashierName: string;
  orderNumber: string;
  dateTime: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  amountTendered: number;
  changeDue: number;
  barcodeData: string;
}

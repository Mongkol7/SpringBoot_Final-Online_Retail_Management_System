// Shared ERD TypeScript Models (Derived from PostgreSQL 18 Schema)

export type CustomerType = 'RETAIL' | 'WHOLESALE';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OrderChannel = 'ONLINE' | 'POS';
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'QR';
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
  avatarUrl?: string;
  companyName?: string;
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
  companyName?: string;
  taxIdOrLicense: string;
  contactDetails?: string;
  reason?: string;
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
  images?: string[] | string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty?: number;
  minStockThreshold: number;
  isPerishable: boolean;
  isDeleted: boolean;
  stockQuantity?: number;
  availableStock?: number;
  currentBatchExpiryDate?: string;
  daysUntilExpiry?: number;
  nearExpiryQuantity?: number;
  clearanceDiscountPercent?: number;
  clearancePrice?: number;
  wholesaleClearancePrice?: number;
  freshStockQuantity?: number;
  freshBatchExpiryDate?: string;
  freshBatchCode?: string;
  batchCode?: string;
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
  batchPreference?: 'FRESH' | 'CLEARANCE';
  expiryDate?: string;
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

export interface PosProductBatchDto {
  batchId: number;
  batchCode: string;
  expiryDate?: string;
  currentQuantity: number;
  isNearExpiry: boolean;
  daysUntilExpiry: number;
}

export interface PosProductScan {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryName?: string;
  imageUrl?: string;
  retailPrice: number;
  wholesalePrice?: number;
  costPrice?: number;
  availableStock: number;
  isPerishable: boolean;
  minStockThreshold?: number;
  currentBatchExpiryDate?: string;
  currentBatchCode?: string;
  nearExpiryQuantity?: number;
  clearancePrice?: number;
  freshStockQuantity?: number;
  freshBatchExpiryDate?: string;
  freshBatchCode?: string;
  batches?: PosProductBatchDto[];
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  batchPreference?: 'FRESH' | 'CLEARANCE';
  expiryDate?: string;
  isClearance?: boolean;
  expiryStatus?: string;
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

export interface PosSaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  batchPreference?: 'FRESH' | 'CLEARANCE';
}

export interface PosSaleSummary {
  id: number;
  orderNumber: string;
  cashierId: number | null;
  cashierName: string;
  customerName: string;
  channel: string;
  paymentMethod: PaymentMethod;
  totalItemsCount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: PosSaleItem[];
}

export interface ExecutiveKpiSummary {
  totalGrossRevenue: number;
  onlineRevenue: number;
  posRevenue: number;
  onlineOrdersCount: number;
  posOrdersCount: number;
  pendingWholesaleApplicationsCount: number;
  expiredBatchesCount: number;
  soonExpiringBatchesCount?: number;
  lowStockProductsCount: number;
  totalStockValuation?: number;
  totalStockRetailValue?: number;
  netLoss?: number;
}

export interface SalesSeriesPoint {
  date: string;
  onlineRevenue: number;
  posRevenue: number;
  totalRevenue: number;
  orderCount: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: { id: number; name: string };
  customerType: CustomerType;
  isActive: boolean;
  address?: string;
  addresses?: string;
  avatarUrl?: string;
  profileImg?: string;
  createdAt?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  roleName: string;
  customerType?: CustomerType;
  avatarUrl?: string;
  profileImg?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  roleName?: string;
  customerType?: CustomerType;
  isActive?: boolean;
  password?: string;
  avatarUrl?: string;
  profileImg?: string;
}

export interface AdminWholesaleApp {
  id: number;
  businessName: string;
  taxIdOrLicense: string;
  status: ApplicationStatus;
  user?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    customerType?: CustomerType;
    isActive?: boolean;
    createdAt?: string;
    addresses?: string;
    role?: { id: number; name: string };
  };
  contactPhone?: string;
  businessAddress?: string;
  businessCategory?: string;
  estimatedMonthlyVolume?: string;
  tradeLicenseType?: string;
  reviewedBy?: { id: number; fullName: string };
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: number;
  type: TransactionType;
  quantityDelta: number;
  reason?: string;
  cause?: string;
  unitPrice?: number;
  totalValue?: number;
  referenceDoc?: string;
  location?: string;
  batch?: {
    id: number;
    batchCode: string;
    expiryDate?: string;
    supplierName?: string;
    currentQuantity?: number;
    product?: {
      id?: number;
      name: string;
      sku: string;
      imageUrl?: string;
      costPrice?: number;
      retailPrice?: number;
      wholesalePrice?: number;
      categoryName?: string;
    };
  };
  user?: {
    id: number;
    fullName: string;
    email: string;
    role?: { id: number; name: string } | string;
  };
  createdAt: string;
}

export interface AdminBatchItem {
  id: number;
  batchCode: string;
  initialQuantity: number;
  currentQuantity: number;
  expiryDate?: string;
  isExpired: boolean;
  receivedAt: string;
}

export interface AdminProductDetail {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryName?: string;
  imageUrl?: string;
  images?: string;
  otherImages?: string[];
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  retailMarginPercent: number;
  wholesaleMarginPercent: number;
  availableStock: number;
  minStockThreshold: number;
  isPerishable: boolean;
  currentBatchCode?: string;
  currentBatchExpiryDate?: string;
  batches?: AdminBatchItem[];
}

export interface AdminPaymentItem {
  id: number;
  productName: string;
  sku: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  originalPrice?: number;
  isPerishable?: boolean;
  expiryDate?: string;
  pricingTier?: string;
}

export interface AdminPayment {
  id: number;
  orderNumber: string;
  channel: 'POS' | 'ONLINE' | string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | string;
  status: string;
  pricingTierUsed: 'RETAIL' | 'WHOLESALE' | string;
  customerCategory?: 'WALK_IN' | 'ONLINE' | 'WHOLESALE' | string;
  customerName?: string;
  customerEmail?: string;
  cashierName?: string;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items?: AdminPaymentItem[];
}

export interface CustomerSpendingSummary {
  customerName: string;
  customerEmail?: string;
  customerCategory: 'WALK_IN' | 'ONLINE' | 'WHOLESALE' | string;
  pricingTier: 'RETAIL' | 'WHOLESALE' | string;
  totalOrders: number;
  totalItemsPurchased: number;
  totalSpending: number;
  totalNet: number;
  totalTax: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  payments: AdminPayment[];
}

export interface FinancialTaxReport {
  totalGrossRevenue: number;
  totalTaxCollected: number;
  totalNetRevenue: number;
  posGrossRevenue: number;
  posTaxCollected: number;
  onlineGrossRevenue: number;
  onlineTaxCollected: number;
  cardTotal: number;
  cashTotal: number;
  bankTransferTotal: number;
  totalOrdersCount: number;
  posOrdersCount: number;
  onlineOrdersCount: number;
  generatedAt: string;
}



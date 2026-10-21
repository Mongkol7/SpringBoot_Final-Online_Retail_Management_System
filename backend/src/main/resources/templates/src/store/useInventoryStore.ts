import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  StockBatch,
  StockCategory,
  StockProduct,
  StockSupplier,
  StockTransaction,
  hasInventorySession,
  clearInventorySession,
  loginInventory,
  loadStockWorkspace,
  productApi,
  batchApi,
  supplierApi,
  categoryApi,
  getInventoryError,
  getValidInventoryToken
} from '../services/inventoryService';
import {
  MOCK_BATCHES,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_SUPPLIERS,
  MOCK_TRANSACTIONS
} from '../features/inventory/mocks/mockInventoryData';

export type StockTab = 'overview' | 'catalog' | 'batches' | 'ledger' | 'suppliers' | 'intake';
export type RadarFilter = 'all' | 'healthy' | 'low-stock' | 'expired';

export interface BatchStatusInfo {
  label: string;
  className: 'healthy' | 'soon' | 'expired';
  days: number | null;
}

export interface ToastMessage {
  kind: 'success' | 'error';
  message: string;
}

export function remainingDays(value?: string): number | null {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.ceil((target - today) / 86400000);
}

export function computeBatchState(batch: StockBatch): BatchStatusInfo {
  const days = remainingDays(batch.expiryDate);
  if (batch.isExpired || (days !== null && days < 0)) {
    return { label: 'Expired · Locked', className: 'expired', days };
  }
  if (days !== null && days <= 7) {
    return { label: days === 0 ? 'Expires today' : `${days}d left · Soon`, className: 'soon', days };
  }
  return { label: 'Active · Healthy', className: 'healthy', days };
}

interface InventoryState {
  // Data
  products: StockProduct[];
  categories: StockCategory[];
  suppliers: StockSupplier[];
  batches: StockBatch[];
  transactions: StockTransaction[];

  // Session & Sync
  isConnected: boolean;
  isSyncing: boolean;
  syncError: string | null;
  toast: ToastMessage | null;

  // View & Filters
  activeTab: StockTab;
  search: string;
  categoryFilter: string;
  showArchived: boolean;
  transactionFilter: string;
  radarFilter: RadarFilter;

  // Modals & Active Edit Targets
  activeModal: 'product' | 'supplier' | 'categories' | 'stockIn' | 'adjustment' | 'login' | null;
  editingProduct: StockProduct | null;
  editingSupplier: StockSupplier | null;
  selectedBatch: StockBatch | null;
  preselectedProductForIntake: StockProduct | null;

  // Helpers / Computed
  productStock: (productId: number) => number;
  lowStockProducts: () => StockProduct[];
  soonExpiringCount: () => number;

  // Actions
  setTab: (tab: StockTab) => void;
  setSearch: (search: string) => void;
  setCategoryFilter: (filter: string) => void;
  setShowArchived: (show: boolean) => void;
  setTransactionFilter: (type: string) => void;
  setRadarFilter: (filter: RadarFilter) => void;
  notify: (message: string, kind?: 'success' | 'error') => void;
  clearToast: () => void;

  openModal: (
    modal: 'product' | 'supplier' | 'categories' | 'stockIn' | 'adjustment' | 'login',
    payload?: any
  ) => void;
  closeModal: () => void;

  // Network Actions
  syncSession: () => void;
  refresh: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;

  // Product Actions
  saveProduct: (data: {
    sku: string;
    name: string;
    description: string;
    imageUrl: string;
    images?: string[];
    categoryId: number;
    costPrice: number;
    retailPrice: number;
    wholesalePrice: number;
    minStockThreshold: number;
    isPerishable: boolean;
  }) => Promise<boolean>;
  toggleProductArchive: (product: StockProduct) => Promise<void>;

  // Supplier Actions
  saveSupplier: (data: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    profileImage?: string;
  }) => Promise<boolean>;
  deleteSupplier: (supplier: StockSupplier) => Promise<void>;

  // Category Actions
  createCategory: (name: string, description?: string) => Promise<boolean>;
  deleteCategory: (category: StockCategory) => Promise<void>;

  // Batch & Intake Actions
  recordStockIn: (data: {
    productId: number;
    supplierId: number;
    batchCode: string;
    quantity: number;
    expiryDate: string | null;
  }) => Promise<boolean>;
  recordAdjustment: (data: {
    batchId: number;
    delta: number;
    reason: string;
  }) => Promise<boolean>;
  triggerExpiryCheck: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(persist((set, get) => ({
  products: MOCK_PRODUCTS,
  categories: MOCK_CATEGORIES,
  suppliers: MOCK_SUPPLIERS,
  batches: MOCK_BATCHES,
  transactions: MOCK_TRANSACTIONS,

  isConnected: hasInventorySession(),
  isSyncing: false,
  syncError: null,
  toast: null,

  activeTab: 'overview',
  search: '',
  categoryFilter: 'all',
  showArchived: false,
  transactionFilter: 'ALL',
  radarFilter: 'all',

  activeModal: null,
  editingProduct: null,
  editingSupplier: null,
  selectedBatch: null,
  preselectedProductForIntake: null,

  productStock: (productId: number) => {
    const { batches } = get();
    return batches
      .filter((b) => b.product?.id === productId && !computeBatchState(b).className.includes('expired'))
      .reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);
  },

  lowStockProducts: () => {
    const { products, batches } = get();
    return products.filter((p) => {
      if (p.isDeleted) return false;
      const stock = batches
        .filter((b) => b.product?.id === p.id && !computeBatchState(b).className.includes('expired'))
        .reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);
      return stock <= p.minStockThreshold;
    });
  },

  soonExpiringCount: () => {
    const { batches } = get();
    return batches.filter(
      (b) => b.currentQuantity > 0 && computeBatchState(b).className === 'soon'
    ).length;
  },

  setTab: (activeTab) => set({ activeTab }),
  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setShowArchived: (showArchived) => set({ showArchived }),
  setTransactionFilter: (transactionFilter) => set({ transactionFilter }),
  setRadarFilter: (radarFilter) => set({ radarFilter }),

  notify: (message, kind = 'success') => {
    set({ toast: { message, kind } });
    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 3800);
  },

  clearToast: () => set({ toast: null }),

  openModal: (modal, payload) => {
    if (modal === 'product') {
      set({ activeModal: 'product', editingProduct: payload || null });
    } else if (modal === 'supplier') {
      set({ activeModal: 'supplier', editingSupplier: payload || null });
    } else if (modal === 'adjustment') {
      set({ activeModal: 'adjustment', selectedBatch: payload || null });
    } else if (modal === 'stockIn') {
      set({ activeModal: 'stockIn', preselectedProductForIntake: payload || null });
    } else {
      set({ activeModal: modal });
    }
  },

  closeModal: () =>
    set({
      activeModal: null,
      editingProduct: null,
      editingSupplier: null,
      selectedBatch: null,
      preselectedProductForIntake: null
    }),

  syncSession: () => {
    set({ isConnected: hasInventorySession() });
  },

  refresh: async () => {
    set({ isSyncing: true });
    try {
      await getValidInventoryToken();
      const data = await loadStockWorkspace();
      set({
        products: data.products,
        categories: data.categories,
        suppliers: data.suppliers,
        batches: data.batches,
        transactions: data.transactions,
        isConnected: true,
        syncError: null
      });
    } catch (err) {
      set({ syncError: getInventoryError(err) });
    } finally {
      set({ isSyncing: false });
    }
  },

  login: async (email, password) => {
    set({ isSyncing: true });
    try {
      await loginInventory(email, password);
      set({ isConnected: true, activeModal: null });
      get().notify('Connected to live backend inventory.');
      await get().refresh();
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      throw err;
    } finally {
      set({ isSyncing: false });
    }
  },

  logout: () => {
    clearInventorySession();
    set({
      isConnected: false,
      syncError: null,
      products: MOCK_PRODUCTS,
      categories: MOCK_CATEGORIES,
      suppliers: MOCK_SUPPLIERS,
      batches: MOCK_BATCHES,
      transactions: MOCK_TRANSACTIONS
    });
    get().notify('Signed out. Local preview active.');
  },

  saveProduct: async (data) => {
    const { isConnected, editingProduct, categories, products } = get();

    const duplicate = products.some((product) =>
      product.id !== editingProduct?.id &&
      (product.category?.id ?? product.categoryId) === data.categoryId &&
      product.name.trim().toLocaleLowerCase() === data.name.trim().toLocaleLowerCase() &&
      !product.isDeleted
    );
    if (duplicate) {
      get().notify('A product with this name already exists in the selected category.', 'error');
      return false;
    }

    // Contract validation: cost <= wholesale <= retail
    if (data.costPrice > data.wholesalePrice || data.wholesalePrice > data.retailPrice) {
      get().notify('Invalid pricing: costPrice ≤ wholesalePrice ≤ retailPrice required.', 'error');
      return false;
    }

    try {
      const category = categories.find((c) => c.id === data.categoryId);

      if (isConnected) {
        if (editingProduct) {
          await productApi.update(editingProduct.id, data);
        } else {
          await productApi.create(data);
        }
        await get().refresh();
      } else {
        // Optimistic local update
        if (editingProduct) {
          set({
            products: products.map((p) =>
              p.id === editingProduct.id ? { ...p, ...data, category } : p
            )
          });
        } else {
          const newProduct: StockProduct = {
            ...data,
            id: Math.max(0, ...products.map((p) => p.id)) + 1,
            category,
            isDeleted: false
          };
          set({ products: [newProduct, ...products] });
        }
      }

      get().closeModal();
      get().notify(editingProduct ? 'Product details updated.' : 'Product added to catalog.');
      return true;
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      return false;
    }
  },

  toggleProductArchive: async (product: StockProduct) => {
    const { isConnected, products } = get();
    try {
      if (isConnected) {
        if (product.isDeleted) {
          await productApi.restore(product.id);
        } else {
          await productApi.delete(product.id);
        }
        await get().refresh();
      } else {
        set({
          products: products.map((p) =>
            p.id === product.id ? { ...p, isDeleted: !p.isDeleted } : p
          )
        });
      }
      get().notify(product.isDeleted ? `Restored "${product.name}".` : `Archived "${product.name}".`);
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
    }
  },

  saveSupplier: async (data) => {
    const { isConnected, editingSupplier, suppliers } = get();
    try {
      if (isConnected) {
        if (editingSupplier) {
          await supplierApi.update(editingSupplier.id, data);
        } else {
          await supplierApi.create(data);
        }
        await get().refresh();
      } else {
        if (editingSupplier) {
          set({
            suppliers: suppliers.map((s) =>
              s.id === editingSupplier.id ? { ...s, ...data } : s
            )
          });
        } else {
          const newSup: StockSupplier = {
            ...data,
            id: Math.max(0, ...suppliers.map((s) => s.id)) + 1
          };
          set({ suppliers: [...suppliers, newSup] });
        }
      }
      get().closeModal();
      get().notify(editingSupplier ? 'Supplier profile updated.' : 'Supplier registered.');
      return true;
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      return false;
    }
  },

  deleteSupplier: async (supplier) => {
    const { isConnected, suppliers } = get();
    try {
      if (isConnected) {
        await supplierApi.delete(supplier.id);
        await get().refresh();
      } else {
        set({ suppliers: suppliers.filter((s) => s.id !== supplier.id) });
      }
      get().notify(`Removed supplier "${supplier.name}".`);
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
    }
  },

  createCategory: async (name, description = '') => {
    const { isConnected, categories } = get();
    const trimmedName = name.trim();
    if (!trimmedName) {
      get().notify('Category name is required.', 'error');
      return false;
    }
    if (categories.some((category) => category.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      get().notify(`Category "${trimmedName}" already exists.`, 'error');
      return false;
    }
    try {
      if (isConnected) {
        await categoryApi.create(trimmedName, description.trim());
        await get().refresh();
      } else {
        const newCat: StockCategory = {
          id: Math.max(0, ...categories.map((c) => c.id)) + 1,
          name: trimmedName,
          description: description.trim()
        };
        set({ categories: [...categories, newCat] });
      }
      get().notify(`Category "${trimmedName}" created.`);
      return true;
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      return false;
    }
  },

  deleteCategory: async (category) => {
    const { isConnected, categories } = get();
    try {
      if (isConnected) {
        await categoryApi.delete(category.id);
        await get().refresh();
      } else {
        set({ categories: categories.filter((c) => c.id !== category.id) });
      }
      get().notify(`Category "${category.name}" removed.`);
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
    }
  },

  recordStockIn: async (data) => {
    const { isConnected, products, suppliers, batches, transactions } = get();
    const product = products.find((p) => p.id === data.productId);
    if (!product) {
      get().notify('Product not found.', 'error');
      return false;
    }

    if (product.isPerishable && !data.expiryDate) {
      get().notify('Expiry date is mandatory for perishable products.', 'error');
      return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (data.expiryDate && data.expiryDate <= today) {
      get().notify('Expiry date must be a future date. Stock delivery was not ingested.', 'error');
      return false;
    }

    const code = data.batchCode.trim() || `BATCH-${product.sku}-${Date.now().toString().slice(-4)}`;

    try {
      if (isConnected) {
        await batchApi.stockIn({
          productId: data.productId,
          supplierId: data.supplierId,
          batchCode: code,
          quantity: data.quantity,
          expiryDate: data.expiryDate
        });
        await get().refresh();
      } else {
        const supplier = suppliers.find((s) => s.id === data.supplierId) || suppliers[0];
        const newBatch: StockBatch = {
          id: Math.max(0, ...batches.map((b) => b.id)) + 1,
          batchCode: code,
          product,
          supplier,
          initialQuantity: data.quantity,
          currentQuantity: data.quantity,
          expiryDate: data.expiryDate || undefined,
          isExpired: false,
          receivedAt: new Date().toISOString()
        };
        const newTx: StockTransaction = {
          id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
          batch: newBatch,
          type: 'STOCK_IN',
          quantityDelta: data.quantity,
          reason: `Stock-In intake from ${supplier?.name || 'supplier'}`,
          createdAt: new Date().toISOString()
        };
        set({
          batches: [newBatch, ...batches],
          transactions: [newTx, ...transactions]
        });
      }

      get().closeModal();
      get().notify(`Received ${data.quantity} units of ${product.name} (Batch: ${code}).`);
      return true;
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      return false;
    }
  },

  recordAdjustment: async (data) => {
    const { isConnected, batches, transactions } = get();
    const batch = batches.find((b) => b.id === data.batchId);
    if (!batch) {
      get().notify('Batch not found.', 'error');
      return false;
    }

    if (batch.currentQuantity + data.delta < 0) {
      get().notify(`Cannot deduct more than current batch quantity (${batch.currentQuantity}).`, 'error');
      return false;
    }

    try {
      if (isConnected) {
        await batchApi.adjust({
          batchId: data.batchId,
          quantityDelta: data.delta,
          reason: data.reason.trim() || 'Manual stock adjustment'
        });
        await get().refresh();
      } else {
        const updatedBatch = { ...batch, currentQuantity: batch.currentQuantity + data.delta };
        const newTx: StockTransaction = {
          id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
          batch: updatedBatch,
          type: data.delta > 0 ? 'STOCK_IN' : 'MANUAL_ADJUSTMENT',
          quantityDelta: data.delta,
          reason: data.reason || 'Manual inventory adjustment',
          createdAt: new Date().toISOString()
        };
        set({
          batches: batches.map((b) => (b.id === batch.id ? updatedBatch : b)),
          transactions: [newTx, ...transactions]
        });
      }

      get().closeModal();
      get().notify(`Batch ${batch.batchCode} adjusted by ${data.delta > 0 ? '+' : ''}${data.delta}.`);
      return true;
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
      return false;
    }
  },

  triggerExpiryCheck: async () => {
    const { isConnected, batches, transactions } = get();
    get().notify('Running automated expiry radar scan…');
    try {
      if (isConnected) {
        await batchApi.triggerExpiryCheck();
        await get().refresh();
        get().notify('Batch expiry check scan completed.');
      } else {
        // Run mock scan: Mark batches with past expiry as expired
        let markedCount = 0;
        const now = new Date();
        const updatedBatches = batches.map((b) => {
          if (b.expiryDate && new Date(`${b.expiryDate}T23:59:59`) < now && !b.isExpired) {
            markedCount++;
            return { ...b, isExpired: true };
          }
          return b;
        });

        if (markedCount > 0) {
          const newTx: StockTransaction = {
            id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
            type: 'EXPIRED_WRITE_OFF',
            quantityDelta: 0,
            reason: `System scan auto-locked ${markedCount} expired batches`,
            createdAt: new Date().toISOString()
          };
          set({ batches: updatedBatches, transactions: [newTx, ...transactions] });
          get().notify(`Scan locked ${markedCount} expired batches from sale.`);
        } else {
          get().notify('Radar scan finished. All active batches are compliant.');
        }
      }
    } catch (err) {
      get().notify(getInventoryError(err), 'error');
    }
  }
}), {
  name: 'retail-inventory-local',
  partialize: (state) => ({
    products: state.products,
    categories: state.categories,
    suppliers: state.suppliers,
    batches: state.batches,
    transactions: state.transactions
  })
}));

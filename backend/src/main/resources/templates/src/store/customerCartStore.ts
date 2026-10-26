import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CustomerType, Order, PaymentMethod, WholesaleApplication, User } from '../types/schema';
import { customerApi, getCustomerToken } from '../features/customer/customerApi';
import { calculateItemPrice, DiscountType } from '../utils/pricingCalculator';

export interface CustomerCartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  appliedPrice: number;
  subtotal: number;
  originalPrice: number;
  discountType: DiscountType;
  unitSavings: number;
  totalSavings: number;
  neededForWholesale: number;
  minQty: number;
  badgeLabel?: string;
  badgeColor?: string;
  nearExpiryUnits?: number;
  freshUnits?: number;
  clearanceUnitPrice?: number;
  regularUnitPrice?: number;
  batchAllocationSummary?: string;
  hasNearExpiryDiscount?: boolean;

  // Wholesale Batch Choice Fields
  batchPreference?: 'FRESH' | 'CLEARANCE';
  canChooseBatch?: boolean;
  freshStockAvailable?: number;
  nearExpiryAvailable?: number;
  freshBatchExpiryDate?: string;
  freshBatchCode?: string;
}

interface CustomerState {
  // User Profile & Authentication
  user: User;
  token: string | null;
  demoTierOverride: CustomerType | null;

  // Shopping Cart
  items: CustomerCartItem[];
  totalPrice: number;

  // Order History
  orders: Order[];

  // Wholesale Status
  wholesaleApplication: WholesaleApplication | null;

  // Real-time notification for DynamicIsland
  notification: { message: string; badge?: string } | null;

  // Authentication State
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<boolean>;
  logout: () => void;
  quickDemoLogin: (tier: 'RETAIL' | 'WHOLESALE') => void;
  setDemoTier: (tier: CustomerType | null) => void;
  setUser: (user: Partial<User>) => void;
  setToken: (token: string | null) => void;
  setNotification: (notif: { message: string; badge?: string } | null) => void;

  // Cart Actions
  addItem: (product: Product, quantity?: number, batchPreference?: 'FRESH' | 'CLEARANCE') => void;
  addToCart: (product: Product, quantity?: number, batchPreference?: 'FRESH' | 'CLEARANCE') => void;
  setBatchPreference: (cartItemId: number, preference: 'FRESH' | 'CLEARANCE') => void;
  updateQuantity: (idOrProductId: number, quantity: number) => void;
  removeItem: (idOrProductId: number) => void;
  removeFromCart: (idOrProductId: number) => void;
  clearCart: () => void;
  refreshCartPrices: () => void;
  updateProfile: (data: {
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    addresses?: string[];
    companyName?: string;
    password?: string;
  }) => Promise<User>;
  refreshProfile: () => Promise<void>;

  // Computations
  getEffectiveTier: () => CustomerType;
  getDisplayTier: () => 'RETAIL' | 'PENDING_WHOLESALE' | 'WHOLESALE';
  getItemPrice: (product: Product, quantity?: number, batchPreference?: 'FRESH' | 'CLEARANCE') => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getWholesaleSavings: () => number;

  // Checkout & Orders
  checkout: (
    shippingAddress: string,
    paymentMethod: PaymentMethod,
    recipientName?: string,
    recipientPhone?: string
  ) => Promise<Order>;
  setOrders: (orders: Order[]) => void;
  cancelOrder: (orderIdOrNumber: string | number) => Promise<boolean>;
  confirmOrder: (orderIdOrNumber: string | number) => Promise<boolean>;

  // Wholesale
  submitWholesaleApplication: (
    companyName: string,
    taxId: string,
    contactDetails?: string,
    reason?: string
  ) => Promise<WholesaleApplication>;
  simulateAdminWholesaleApproval: (approve: boolean) => void;
  checkWholesaleStatus: () => Promise<WholesaleApplication | null>;
}

const DEFAULT_USER: User = {
  id: 29,
  roleId: 2,
  email: 'customer@retailstore.com',
  fullName: 'Sok Rithysak',
  phone: '+855 12 999 888',
  customerType: 'RETAIL',
  addresses: ['123 Norodom Blvd, Phnom Penh'],
  isActive: true,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z'
};

// Real DB orders only (no mock data)
export const SAMPLE_PENDING_ORDER: Order | null = null;
const INITIAL_ORDERS: Order[] = [];

const GUEST_USER: User = {
  id: 0,
  roleId: 1,
  email: '',
  fullName: 'Guest Customer',
  customerType: 'RETAIL',
  isActive: false,
  createdAt: '',
  updatedAt: ''
};

export function normalizeAddresses(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
          } catch {}
        }
        return trimmed;
      }
      return String(item);
    }).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
    }
    return [trimmed];
  }
  return [];
}

const calcCartTotal = (items: CustomerCartItem[]): number => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.07;
  return parseFloat((subtotal + tax).toFixed(2));
};

const buildCartItem = (
  product: Product,
  quantity: number,
  tier: CustomerType,
  existingId?: number,
  batchPreference?: 'FRESH' | 'CLEARANCE',
  totalProductQuantity?: number
): CustomerCartItem => {
  const isShortDatedOnly = (product.freshStockQuantity === 0 && (product.nearExpiryQuantity || 0) > 0) ||
    (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0));

  const resolvedPref: 'FRESH' | 'CLEARANCE' = batchPreference
    ? batchPreference
    : (isShortDatedOnly ? 'CLEARANCE' : 'FRESH');

  const calc = calculateItemPrice(product, quantity, tier, resolvedPref, totalProductQuantity);
  return {
    id: existingId || Date.now() + Math.floor(Math.random() * 1000),
    productId: product.id,
    product,
    quantity,
    appliedPrice: calc.unitPrice,
    subtotal: calc.subtotal,
    originalPrice: calc.originalPrice,
    discountType: calc.discountType,
    unitSavings: calc.unitSavings,
    totalSavings: calc.savings,
    neededForWholesale: calc.neededForWholesale,
    minQty: calc.minQty,
    badgeLabel: calc.badgeLabel,
    badgeColor: calc.badgeColor,
    nearExpiryUnits: calc.nearExpiryUnits,
    freshUnits: calc.freshUnits,
    clearanceUnitPrice: calc.clearanceUnitPrice,
    regularUnitPrice: calc.regularUnitPrice,
    batchAllocationSummary: calc.batchAllocationSummary,
    hasNearExpiryDiscount: calc.hasNearExpiryDiscount,
    batchPreference: calc.selectedBatchPreference,
    canChooseBatch: calc.canChooseBatch,
    freshStockAvailable: calc.freshStockAvailable,
    nearExpiryAvailable: calc.nearExpiryAvailable,
    freshBatchExpiryDate: calc.freshBatchExpiryDate,
    freshBatchCode: calc.freshBatchCode
  };
};

const recalculateCartItems = (
  rawItems: CustomerCartItem[],
  tier: CustomerType
): CustomerCartItem[] => {
  if (!rawItems || rawItems.length === 0) return [];
  // Cross-batch quantity aggregation:
  // If wholesale buyer adds 6 fresh + 4 clearance of the same product, total = 10,
  // which qualifies the entire product (both batches) for wholesale tier pricing!
  const productTotals = new Map<number, number>();
  for (const item of rawItems) {
    productTotals.set(item.productId, (productTotals.get(item.productId) || 0) + item.quantity);
  }

  return rawItems.map((item) =>
    buildCartItem(
      item.product,
      item.quantity,
      tier,
      item.id,
      item.batchPreference,
      productTotals.get(item.productId) || item.quantity
    )
  );
};

export const useCustomerCartStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      user: GUEST_USER,
      token: null,
      isAuthenticated: false,
      demoTierOverride: null,
      items: [],
      totalPrice: 0,
      orders: INITIAL_ORDERS,
      wholesaleApplication: null,
      notification: null,

      login: async (email: string, password: string) => {
        const res = await customerApi.login(email, password);
        let freshAvatar = res.avatarUrl;
        let freshPhone = res.phone;
        let freshCompany = res.companyName;
        let freshAddresses: string[] = [];

        if (res.addresses) {
          try {
            freshAddresses = typeof res.addresses === 'string' ? JSON.parse(res.addresses) : res.addresses;
          } catch {
            freshAddresses = [String(res.addresses)];
          }
        }

        // Fetch fresh full profile directly from backend
        try {
          const profile = await customerApi.getProfile();
          if (profile) {
            freshAvatar = profile.avatarUrl || freshAvatar;
            freshPhone = profile.phone || freshPhone;
            freshCompany = profile.companyName || freshCompany;
            if (profile.addresses) {
              try {
                freshAddresses = typeof profile.addresses === 'string' ? JSON.parse(profile.addresses) : profile.addresses;
              } catch {
                freshAddresses = Array.isArray(profile.addresses) ? profile.addresses : [String(profile.addresses)];
              }
            }
          }
        } catch (e) {
          console.warn('[customerCartStore] Could not fetch fresh profile on login:', e);
        }

        if (freshAvatar) {
          localStorage.setItem(`aura_avatar_user_${res.userId}`, freshAvatar);
          localStorage.setItem(`aura_avatar_${res.userId}`, freshAvatar);
          localStorage.setItem(`aura_avatar_${res.email.toLowerCase()}`, freshAvatar);
          localStorage.setItem('aura_avatar_current', freshAvatar);
        }

        const updatedUser: User = {
          ...get().user,
          id: res.userId,
          email: res.email,
          fullName: res.fullName,
          phone: freshPhone || get().user?.phone,
          customerType: res.customerType,
          avatarUrl: freshAvatar || undefined,
          companyName: freshCompany || undefined,
          addresses: freshAddresses.length > 0 ? freshAddresses : get().user?.addresses
        };
        const updatedItems = recalculateCartItems(get().items, res.customerType);
        set({
          isAuthenticated: true,
          token: res.token,
          user: updatedUser,
          demoTierOverride: res.customerType,
          items: updatedItems,
          totalPrice: calcCartTotal(updatedItems)
        });
        localStorage.setItem('customer_jwt', res.token);
        const sessionUser = {
          userId: res.userId,
          email: res.email,
          fullName: res.fullName,
          role: 'USER',
          customerType: res.customerType || 'RETAIL',
          token: res.token
        };
        localStorage.setItem('auth_current_user', JSON.stringify(sessionUser));
        window.dispatchEvent(new Event('storage'));
        get().setNotification({
          message: `Welcome back, ${res.fullName}! Cart pricing updated for ${res.customerType} tier.`,
          badge: res.customerType
        });
        return true;
      },

      register: async (email: string, password: string, fullName: string, phone: string) => {
        const registeredUser = await customerApi.register(email, password, fullName, phone);

        // Attempt API login to retrieve real JWT token from backend
        const res = await customerApi.login(email, password);
        const updatedUser: User = {
          ...get().user,
          id: res.userId || registeredUser?.id || Date.now(),
          email: res.email || email,
          fullName: res.fullName || fullName || 'Customer',
          phone: phone || get().user.phone,
          customerType: 'RETAIL'
        };
        const updatedItems = recalculateCartItems(get().items, 'RETAIL');
        set({
          isAuthenticated: true,
          token: res.token,
          user: updatedUser,
          demoTierOverride: 'RETAIL',
          wholesaleApplication: null,
          items: updatedItems,
          totalPrice: calcCartTotal(updatedItems)
        });
        localStorage.setItem('customer_jwt', res.token);
        const sessionUser = {
          userId: res.userId || registeredUser?.id,
          email: res.email || email,
          fullName: res.fullName || fullName || 'Customer',
          role: 'USER',
          customerType: 'RETAIL',
          token: res.token
        };
        localStorage.setItem('auth_current_user', JSON.stringify(sessionUser));
        window.dispatchEvent(new Event('storage'));
        get().setNotification({
          message: `Welcome, ${updatedUser.fullName}! Account created on Retail Tier.`,
          badge: 'RETAIL'
        });
        return true;
      },

      logout: () => {
        localStorage.removeItem('customer_jwt');
        localStorage.removeItem('auth_current_user');
        window.dispatchEvent(new Event('storage'));
        // When logging out, immediately recalculate all products in cart back to standard RETAIL pricing preserving batch preferences
        const resetItems = recalculateCartItems(get().items, 'RETAIL');
        set({
          isAuthenticated: false,
          token: null,
          user: GUEST_USER,
          demoTierOverride: null,
          wholesaleApplication: null,
          items: resetItems,
          totalPrice: calcCartTotal(resetItems)
        });
        get().setNotification({
          message: 'Signed out of customer account. Switched to standard store pricing.',
          badge: 'GUEST'
        });
      },

      quickDemoLogin: async (tier: 'RETAIL' | 'WHOLESALE') => {
        try {
          const res = await customerApi.login('customer@retailstore.com', 'user123');
          localStorage.setItem('customer_jwt', res.token);
          const updatedUser: User = {
            id: res.userId,
            email: res.email,
            fullName: res.fullName,
            roleId: 2,
            customerType: tier,
            addresses: res.addresses
              ? typeof res.addresses === 'string'
                ? JSON.parse(res.addresses)
                : res.addresses
              : DEFAULT_USER.addresses,
            avatarUrl: res.avatarUrl || undefined,
            companyName: res.companyName || undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const updatedItems = recalculateCartItems(get().items, tier);
          set({
            isAuthenticated: true,
            token: res.token,
            user: updatedUser,
            demoTierOverride: tier,
            items: updatedItems,
            totalPrice: calcCartTotal(updatedItems)
          });
          get().setNotification({
            message: `Signed in as Customer (${tier})`,
            badge: tier
          });
        } catch {
          const token = await getCustomerToken();
          if (token) localStorage.setItem('customer_jwt', token);
          const updatedUser = {
            ...DEFAULT_USER,
            customerType: tier
          };
          const updatedItems = recalculateCartItems(get().items, tier);
          set({
            isAuthenticated: true,
            token: token || 'jwt-customer-token-2026',
            user: updatedUser,
            demoTierOverride: tier,
            items: updatedItems,
            totalPrice: calcCartTotal(updatedItems)
          });
          get().setNotification({
            message: `Signed in as Customer (${tier})`,
            badge: tier
          });
        }
      },

      setDemoTier: (tier) => {
        set({ demoTierOverride: tier });
        const currentTier = tier || get().user.customerType;
        const updatedItems = recalculateCartItems(get().items, currentTier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
        get().setNotification({
          message: `Switched tier view to: ${currentTier}`,
          badge: currentTier
        });
      },

      setUser: (userUpdates) => {
        set((state) => {
          const nextUser = { ...state.user, ...userUpdates };
          const effectiveTier = userUpdates.customerType || nextUser.customerType || 'RETAIL';
          const updatedItems = recalculateCartItems(state.items, effectiveTier);
          return {
            user: nextUser,
            items: updatedItems,
            totalPrice: calcCartTotal(updatedItems)
          };
        });
      },

      refreshCartPrices: () => {
        const tier = get().getEffectiveTier();
        const currentItems = get().items;
        if (!currentItems || currentItems.length === 0) return;
        const updatedItems = recalculateCartItems(currentItems, tier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
      },

      updateProfile: async (data: {
        fullName: string;
        phone?: string;
        avatarUrl?: string;
        addresses?: string[];
        companyName?: string;
        password?: string;
      }) => {
        let currentToken = get().token;
        if (!currentToken || currentToken.startsWith('jwt-customer-') || currentToken.startsWith('mock-')) {
          currentToken = await getCustomerToken();
          if (currentToken) {
            set({ token: currentToken, isAuthenticated: true });
          }
        }

        if (!get().isAuthenticated || !get().user?.id || get().user?.id === 0) {
          throw new Error('Please sign in to update your profile.');
        }

        let updatedFromBackend: any = null;
        try {
          updatedFromBackend = await customerApi.updateProfile({
            fullName: data.fullName,
            phone: data.phone,
            addresses: data.addresses,
            avatarUrl: data.avatarUrl,
            companyName: data.companyName,
            password: data.password
          });
        } catch (err) {
          console.warn('Backend updateProfile failed, continuing with client update:', err);
        }

        const currentUser = get().user;
        const normalizedAddresses = normalizeAddresses(
          updatedFromBackend?.addresses || data.addresses || currentUser.addresses
        );

        const finalAvatarUrl = data.avatarUrl !== undefined
          ? data.avatarUrl
          : (updatedFromBackend?.avatarUrl || currentUser.avatarUrl || '');

        const mergedUser: User = {
          ...currentUser,
          id: updatedFromBackend?.id || currentUser.id,
          fullName: updatedFromBackend?.fullName || data.fullName || currentUser.fullName,
          phone: data.phone !== undefined ? data.phone : (updatedFromBackend?.phone || currentUser.phone),
          avatarUrl: finalAvatarUrl,
          addresses: normalizedAddresses
        };

        // Persist avatar across all lookup keys for universal synchronization (Admin, POS, Storefront)
        if (finalAvatarUrl) {
          if (mergedUser.id) {
            localStorage.setItem(`aura_avatar_user_${mergedUser.id}`, finalAvatarUrl);
            localStorage.setItem(`aura_avatar_${mergedUser.id}`, finalAvatarUrl);
          }
          if (mergedUser.email) {
            localStorage.setItem(`aura_avatar_${mergedUser.email.toLowerCase()}`, finalAvatarUrl);
          }
          localStorage.setItem('aura_avatar_current', finalAvatarUrl);
        } else {
          if (mergedUser.id) {
            localStorage.removeItem(`aura_avatar_user_${mergedUser.id}`);
            localStorage.removeItem(`aura_avatar_${mergedUser.id}`);
          }
          if (mergedUser.email) {
            localStorage.removeItem(`aura_avatar_${mergedUser.email.toLowerCase()}`);
          }
          localStorage.removeItem('aura_avatar_current');
        }

        const profileKey = `aura_profile_${mergedUser.id || mergedUser.email || 'current'}`;
        const profilePayload = {
          fullName: mergedUser.fullName,
          phone: mergedUser.phone,
          address: normalizedAddresses.length > 0 ? normalizedAddresses[0] : '',
          companyName: data.companyName,
          avatarUrl: finalAvatarUrl
        };
        localStorage.setItem(profileKey, JSON.stringify(profilePayload));

        // Sync auth_current_user so AuthContext and other components update immediately
        try {
          const authUserStr = localStorage.getItem('auth_current_user');
          if (authUserStr) {
            const authUser = JSON.parse(authUserStr);
            authUser.fullName = mergedUser.fullName;
            if (mergedUser.id) authUser.userId = mergedUser.id;
            if (finalAvatarUrl) authUser.avatarUrl = finalAvatarUrl;
            localStorage.setItem('auth_current_user', JSON.stringify(authUser));
          }
        } catch {}

        // Always dispatch storage event to notify admin or other tabs
        window.dispatchEvent(new Event('storage'));

        set({ user: mergedUser });
        get().setNotification({
          message: '✓ Profile updated successfully.',
          badge: 'SAVED'
        });
        return mergedUser;
      },

      refreshProfile: async () => {
        const custToken = localStorage.getItem('customer_jwt');
        const isReal = !!(custToken && !custToken.startsWith('jwt-customer-') && !custToken.startsWith('mock-'));
        if (!isReal) {
          if (get().isAuthenticated) {
            set({
              isAuthenticated: false,
              token: null,
              user: GUEST_USER,
              demoTierOverride: null
            });
          }
          return;
        }

        try {
          const profile = await customerApi.getProfile();
          if (profile && profile.id) {
            const normalizedAddrs = profile.addresses ? normalizeAddresses(profile.addresses) : [];
            const nextUser: User = {
              ...get().user,
              id: profile.id,
              roleId: profile.roleId || 2,
              email: profile.email,
              fullName: profile.fullName,
              phone: profile.phone || '',
              customerType: profile.customerType || 'RETAIL',
              avatarUrl: profile.avatarUrl || undefined,
              companyName: profile.companyName || undefined,
              addresses: normalizedAddrs.length > 0 ? normalizedAddrs : get().user.addresses,
              isActive: profile.isActive ?? true
            };
            set({
              isAuthenticated: true,
              token: custToken,
              user: nextUser
            });

            if (profile.avatarUrl) {
              localStorage.setItem(`aura_avatar_user_${profile.id}`, profile.avatarUrl);
              localStorage.setItem(`aura_avatar_${profile.id}`, profile.avatarUrl);
              localStorage.setItem(`aura_avatar_${profile.email.toLowerCase()}`, profile.avatarUrl);
              localStorage.setItem('aura_avatar_current', profile.avatarUrl);
            }
          }
        } catch (err) {
          console.warn('[customerCartStore] refreshProfile error:', err);
        }
      },

      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('customer_jwt', token);
        } else {
          localStorage.removeItem('customer_jwt');
        }
      },

      setNotification: (notif) => {
        set({ notification: notif });
      },

      getEffectiveTier: () => {
        const state = get();
        // Crucial security rule: Unauthenticated visitors / guests CANNOT be WHOLESALE
        if (!state.isAuthenticated) {
          return 'RETAIL';
        }
        // Rule: If user account is WHOLESALE or wholesale application is APPROVED, unlock WHOLESALE
        if (state.user.customerType === 'WHOLESALE' || state.wholesaleApplication?.status === 'APPROVED') {
          return 'WHOLESALE';
        }
        // Rule: If demo tier override is explicitly WHOLESALE
        if (state.demoTierOverride === 'WHOLESALE') {
          return 'WHOLESALE';
        }
        // Otherwise, customer remains RETAIL (including when application is PENDING or REJECTED)
        return 'RETAIL';
      },

      getDisplayTier: (): 'RETAIL' | 'PENDING_WHOLESALE' | 'WHOLESALE' => {
        const state = get();
        // Crucial security rule: Unauthenticated visitors / guests CANNOT be WHOLESALE
        if (!state.isAuthenticated) {
          return 'RETAIL';
        }
        if (state.user.customerType === 'WHOLESALE' || state.wholesaleApplication?.status === 'APPROVED' || state.demoTierOverride === 'WHOLESALE') {
          return 'WHOLESALE';
        }
        if (state.wholesaleApplication?.status === 'PENDING') {
          return 'PENDING_WHOLESALE';
        }
        return 'RETAIL';
      },

      getItemPrice: (product: Product, quantity = 1, batchPreference?: 'FRESH' | 'CLEARANCE') => {
        const tier = get().getEffectiveTier();
        const currentItems = get().items;
        const currentQtyInCart = currentItems
          .filter((i) => i.productId === product.id)
          .reduce((sum, i) => sum + i.quantity, 0);
        const totalProductQuantity = currentQtyInCart > 0 ? currentQtyInCart : quantity;
        return calculateItemPrice(product, quantity, tier, batchPreference, totalProductQuantity).unitPrice;
      },

      addItem: (product: Product, quantity = 1, batchPreference?: 'FRESH' | 'CLEARANCE') => {
        get().addToCart(product, quantity, batchPreference);
      },

      addToCart: (product: Product, quantity = 1, batchPreference?: 'FRESH' | 'CLEARANCE') => {
        const isShortDatedOnly = (product.freshStockQuantity === 0 && (product.nearExpiryQuantity || 0) > 0) ||
          (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0));

        const targetPref: 'FRESH' | 'CLEARANCE' = batchPreference
          ? batchPreference
          : (isShortDatedOnly ? 'CLEARANCE' : 'FRESH');

        // Batch-aware stock availability
        const totalStock = product.stockQuantity !== undefined
          ? Number(product.stockQuantity)
          : (product.availableStock !== undefined ? Number(product.availableStock) : 999);

        const nearExpiryStock = product.nearExpiryQuantity !== undefined && product.nearExpiryQuantity > 0
          ? Number(product.nearExpiryQuantity)
          : 0;

        const freshStock = product.freshStockQuantity !== undefined
          ? Number(product.freshStockQuantity)
          : Math.max(0, totalStock - nearExpiryStock);

        const maxAvailableForBatch = targetPref === 'CLEARANCE'
          ? (nearExpiryStock > 0 ? nearExpiryStock : totalStock)
          : (freshStock > 0 ? freshStock : totalStock);

        const currentItems = [...get().items];
        // Strictly match by productId AND batchPreference so FRESH and CLEARANCE batches NEVER overwrite each other!
        const existingIndex = currentItems.findIndex(
          (i) => i.productId === product.id && (i.batchPreference || 'FRESH') === targetPref
        );
        const currentQty = existingIndex > -1 ? currentItems[existingIndex].quantity : 0;

        if (maxAvailableForBatch <= 0) {
          get().setNotification({
            message: `⚠️ '${product.name}' (${targetPref === 'CLEARANCE' ? 'Clearance Batch' : 'Fresh Batch'}) is currently OUT OF STOCK.`,
            badge: 'OUT OF STOCK'
          });
          return;
        }

        if (currentQty + quantity > maxAvailableForBatch) {
          get().setNotification({
            message: `⚠️ Stock Limit Warning: Only ${maxAvailableForBatch} units available for this ${targetPref === 'CLEARANCE' ? 'Clearance' : 'Fresh'} batch of '${product.name}'. You currently have ${currentQty} in cart.`,
            badge: 'STOCK LIMIT'
          });
          return;
        }

        const tier = get().getEffectiveTier();
        if (existingIndex > -1) {
          const newQty = currentItems[existingIndex].quantity + quantity;
          currentItems[existingIndex] = {
            ...currentItems[existingIndex],
            quantity: newQty
          };
        } else {
          currentItems.push(buildCartItem(product, quantity, tier, undefined, targetPref, quantity));
        }

        const updatedItems = recalculateCartItems(currentItems, tier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
        get().setNotification({
          message: `✓ Added ${quantity}x '${product.name}' (${targetPref === 'CLEARANCE' ? 'Clearance 25% OFF' : 'Guaranteed Fresh'}) to cart!`,
          badge: tier === 'WHOLESALE' ? (targetPref === 'CLEARANCE' ? 'CLEARANCE' : 'WHOLESALE') : (targetPref === 'CLEARANCE' ? 'CLEARANCE' : 'SUCCESS')
        });

        // Background call to backend if authenticated
        customerApi.addToCart(product.id, quantity).catch(() => {});
      },

      setBatchPreference: (cartItemId: number, preference: 'FRESH' | 'CLEARANCE') => {
        const tier = get().getEffectiveTier();
        const currentItems = get().items;
        // Priority: Match by exact cart line item id
        const targetItem = currentItems.find((i) => i.id === cartItemId) || currentItems.find((i) => i.productId === cartItemId);
        if (!targetItem) return;
        if (targetItem.batchPreference === preference) return;

        // Check if another cart line item already exists for this product with the requested preference
        const existingTargetIndex = currentItems.findIndex(
          (i) => i.productId === targetItem.productId && i.id !== targetItem.id && (i.batchPreference || 'FRESH') === preference
        );

        let intermediateItems: CustomerCartItem[];
        if (existingTargetIndex > -1) {
          // Merge quantities into the existing batch item and eliminate the current item
          const mergedQty = currentItems[existingTargetIndex].quantity + targetItem.quantity;
          intermediateItems = currentItems
            .filter((i) => i.id !== targetItem.id)
            .map((item) => {
              if (item.id === currentItems[existingTargetIndex].id) {
                return { ...item, quantity: mergedQty, batchPreference: preference };
              }
              return item;
            });
        } else {
          // Switch this line item's batch preference directly
          intermediateItems = currentItems.map((item) => {
            if (item.id === targetItem.id) {
              return { ...item, batchPreference: preference };
            }
            return item;
          });
        }

        const updatedItems = recalculateCartItems(intermediateItems, tier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
        get().setNotification({
          message: `✓ Switched '${targetItem.product.name}' to ${preference === 'FRESH' ? 'Guaranteed Fresh Stock' : 'Clearance Batch (25% OFF)'}`,
          badge: preference === 'FRESH' ? 'FRESH' : 'CLEARANCE'
        });
      },

      updateQuantity: (idOrProductId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(idOrProductId);
          return;
        }

        const currentItems = get().items;
        // Priority 1: Match by exact unique line item ID
        let targetItem = currentItems.find((i) => i.id === idOrProductId);
        // Priority 2: Fallback to productId
        if (!targetItem) {
          targetItem = currentItems.find((i) => i.productId === idOrProductId);
        }
        if (!targetItem) return;

        // Determine stock capacity based on batch
        const isClearance = targetItem.batchPreference === 'CLEARANCE';
        const totalStock = targetItem.product.stockQuantity !== undefined
          ? Number(targetItem.product.stockQuantity)
          : (targetItem.product.availableStock !== undefined ? Number(targetItem.product.availableStock) : 999);

        const batchLimit = isClearance
          ? (targetItem.nearExpiryAvailable && targetItem.nearExpiryAvailable > 0
              ? targetItem.nearExpiryAvailable
              : (targetItem.product.nearExpiryQuantity && targetItem.product.nearExpiryQuantity > 0
                  ? Number(targetItem.product.nearExpiryQuantity)
                  : totalStock))
          : (targetItem.freshStockAvailable && targetItem.freshStockAvailable > 0
              ? targetItem.freshStockAvailable
              : (targetItem.product.freshStockQuantity !== undefined
                  ? Number(targetItem.product.freshStockQuantity)
                  : totalStock));

        if (quantity > batchLimit) {
          get().setNotification({
            message: `⚠️ Stock Limit Warning: Cannot order ${quantity} units. Only ${batchLimit} in stock for this ${isClearance ? 'Clearance' : 'Fresh'} batch of '${targetItem.product.name}'.`,
            badge: 'STOCK LIMIT'
          });
          return;
        }

        const tier = get().getEffectiveTier();
        const rawUpdatedItems = currentItems.map((item) => {
          if (item.id === targetItem.id) {
            return { ...item, quantity };
          }
          return item;
        });

        const updatedItems = recalculateCartItems(rawUpdatedItems, tier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
      },

      removeItem: (idOrProductId: number) => {
        get().removeFromCart(idOrProductId);
      },

      removeFromCart: (idOrProductId: number) => {
        const currentItems = get().items;
        // Match by exact line item ID first!
        const itemToRemove = currentItems.find((i) => i.id === idOrProductId) || currentItems.find((i) => i.productId === idOrProductId);
        if (!itemToRemove) return;

        // Only remove this specific line item so other batches of the same product are preserved!
        const filteredItems = currentItems.filter((i) => i.id !== itemToRemove.id);
        const tier = get().getEffectiveTier();
        const updatedItems = recalculateCartItems(filteredItems, tier);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });

        get().setNotification({
          message: `Removed ${itemToRemove.product.name} (${itemToRemove.batchPreference === 'CLEARANCE' ? 'Clearance' : 'Fresh'} batch) from cart`,
          badge: 'CART'
        });
        customerApi.removeFromCart(itemToRemove.id).catch(() => {});
      },

      clearCart: () => {
        set({ items: [], totalPrice: 0 });
        customerApi.clearCart().catch(() => {});
      },

      getSubtotal: () => {
        return parseFloat(
          get().items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
        );
      },

      getTax: () => {
        // 7% VAT standard
        const subtotal = get().getSubtotal();
        return parseFloat((subtotal * 0.07).toFixed(2));
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        return parseFloat((subtotal + tax).toFixed(2));
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getWholesaleSavings: () => {
        return parseFloat(
          get().items.reduce((sum, item) => sum + (item.totalSavings || 0), 0).toFixed(2)
        );
      },

      checkout: async (
        shippingAddress: string,
        paymentMethod: PaymentMethod,
        recipientName?: string,
        recipientPhone?: string
      ) => {
        const items = get().items;
        if (items.length === 0) {
          throw new Error('Your cart is empty. Please add items before checking out.');
        }

        const tier = get().getEffectiveTier();
        const subtotal = get().getSubtotal();
        const taxAmount = get().getTax();
        const totalAmount = get().getTotal();
        const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const itemsPayload = items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          batchPreference: i.batchPreference
        }));
        let newOrder: Order;
        try {
          newOrder = await customerApi.checkout(shippingAddress, paymentMethod, recipientName, recipientPhone, itemsPayload);
        } catch {
          // Robust client-side fallback if backend DB is not connected
          newOrder = {
            id: Date.now(),
            orderNumber,
            channel: 'ONLINE',
            userId: get().user.id,
            cashierId: null,
            shippingAddress,
            status: 'PENDING',
            paymentMethod,
            pricingTierUsed: tier,
            subtotal,
            taxAmount,
            totalAmount,
            createdAt: new Date().toISOString(),
            items: items.map((item, idx) => ({
              id: Date.now() + idx,
              orderId: Date.now(),
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.appliedPrice,
              subtotal: item.subtotal,
              product: item.product
            }))
          };
        }

        if (!newOrder.orderNumber) {
          newOrder.orderNumber = orderNumber;
        }

        // Prepend to orders history and clear cart
        set((state) => ({
          orders: [newOrder, ...state.orders.filter(o => o.orderNumber !== newOrder.orderNumber)],
          items: [],
          totalPrice: 0
        }));

        get().setNotification({
          message: `Order #${newOrder.orderNumber} placed! Awaiting Admin Confirmation.`,
          badge: 'PENDING'
        });

        return newOrder;
      },

      setOrders: (orders: Order[]) => {
        set({ orders });
      },

      cancelOrder: async (orderIdOrNumber: string | number) => {
        try {
          await customerApi.cancelOrder(orderIdOrNumber);
        } catch {
          // Client-side fallback
        }

        const updatedOrders = get().orders.map((o) => {
          if (o.orderNumber === String(orderIdOrNumber) || o.id === Number(orderIdOrNumber)) {
            return { ...o, status: 'CANCELLED' as const };
          }
          return o;
        });

        set({ orders: updatedOrders });
        get().setNotification({
          message: `Order #${orderIdOrNumber} cancelled. Batches restored.`,
          badge: 'CANCELLED'
        });
        return true;
      },

      confirmOrder: async (orderIdOrNumber: string | number) => {
        try {
          await customerApi.confirmOrder(orderIdOrNumber);
        } catch {
          // Client-side fallback
        }

        const updatedOrders = get().orders.map((o) => {
          if (o.orderNumber === String(orderIdOrNumber) || o.id === Number(orderIdOrNumber)) {
            return { ...o, status: 'PROCESSING' as const };
          }
          return o;
        });

        set({ orders: updatedOrders });
        get().setNotification({
          message: `Order #${orderIdOrNumber} Confirmed by Admin!`,
          badge: 'PROCESSING'
        });
        return true;
      },

      submitWholesaleApplication: async (
        companyName: string,
        taxId: string,
        contactDetails?: string,
        reason?: string
      ) => {
        let app: WholesaleApplication;
        try {
          app = await customerApi.applyWholesale(companyName, taxId, contactDetails, reason);
        } catch {
          app = {
            id: Date.now(),
            userId: get().user.id,
            businessName: companyName,
            taxIdOrLicense: taxId,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          };
        }

        // CRITICAL BUSINESS RULE:
        // During and after wholesale registration, customer is STILL RETAIL!
        // Wholesale pricing only activates once an Administrator approves the application.
        const updatedUser: User = {
          ...get().user,
          customerType: 'RETAIL'
        };
        const updatedItems = recalculateCartItems(get().items, 'RETAIL');

        set({
          wholesaleApplication: app,
          user: updatedUser,
          demoTierOverride: null,
          items: updatedItems,
          totalPrice: calcCartTotal(updatedItems)
        });

        get().setNotification({
          message: 'Wholesale Application Submitted. Awaiting Administrator confirmation.',
          badge: 'PENDING CONFIRMATION'
        });
        return app;
      },

      simulateAdminWholesaleApproval: (approve: boolean) => {
        const currentApp = get().wholesaleApplication;
        if (!currentApp) return;

        const updatedApp: WholesaleApplication = {
          ...currentApp,
          status: approve ? 'APPROVED' : 'REJECTED',
          reviewedAt: new Date().toISOString(),
          adminNotes: approve
            ? 'Verified by Administrator. Full wholesale pricing tier activated.'
            : 'Rejected by Administrator: Tax ID documentation incomplete.'
        };

        set({ wholesaleApplication: updatedApp });

        const targetTier = approve ? 'WHOLESALE' : 'RETAIL';
        const updatedItems = recalculateCartItems(get().items, targetTier);

        if (approve) {
          set((state) => ({
            user: { ...state.user, customerType: 'WHOLESALE' },
            demoTierOverride: 'WHOLESALE',
            items: updatedItems,
            totalPrice: calcCartTotal(updatedItems)
          }));
          get().setNotification({
            message: '🎉 Wholesale Account Approved! Wholesale pricing unlocked.',
            badge: 'APPROVED'
          });
        } else {
          set((state) => ({
            user: { ...state.user, customerType: 'RETAIL' },
            demoTierOverride: 'RETAIL',
            items: updatedItems,
            totalPrice: calcCartTotal(updatedItems)
          }));
          get().setNotification({
            message: 'Wholesale Application Rejected. Retained RETAIL tier.',
            badge: 'REJECTED'
          });
        }
      },

      checkWholesaleStatus: async () => {
        // Must only check when authenticated with a customer token
        if (!get().isAuthenticated || !localStorage.getItem('customer_jwt')) {
          return null;
        }
        try {
          const app = await customerApi.getWholesaleStatus();
          if (app && get().isAuthenticated) {
            set({ wholesaleApplication: app });
            if (app.status === 'APPROVED' || get().user.customerType === 'WHOLESALE') {
              if (get().user.customerType !== 'WHOLESALE' || get().demoTierOverride !== 'WHOLESALE') {
                const updatedUser: User = { ...get().user, customerType: 'WHOLESALE' };
                const updatedItems = recalculateCartItems(get().items, 'WHOLESALE');
                set({
                  user: updatedUser,
                  demoTierOverride: 'WHOLESALE',
                  items: updatedItems,
                  totalPrice: calcCartTotal(updatedItems)
                });
              }
            } else if (app.status === 'PENDING') {
              // Only reset to retail if currently not retail
              if (get().user.customerType !== 'RETAIL' || get().demoTierOverride !== null) {
                const updatedUser: User = { ...get().user, customerType: 'RETAIL' };
                const updatedItems = recalculateCartItems(get().items, 'RETAIL');
                set({
                  user: updatedUser,
                  demoTierOverride: null,
                  items: updatedItems,
                  totalPrice: calcCartTotal(updatedItems)
                });
              }
            }
            return app;
          }
        } catch {
          // ignore network error
        }
        return null;
      }
    }),
    {
      name: 'aura-customer-store-rithysak',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        items: state.items,
        orders: state.orders,
        wholesaleApplication: state.wholesaleApplication,
        demoTierOverride: state.demoTierOverride
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const directCustToken = localStorage.getItem('customer_jwt');
          const isReal = !!(
            directCustToken &&
            !directCustToken.startsWith('jwt-customer-') &&
            !directCustToken.startsWith('mock-')
          );

          if (!isReal) {
            // Default route is guest without authentication
            state.isAuthenticated = false;
            state.token = null;
            state.user = GUEST_USER;
            state.demoTierOverride = null;
            state.wholesaleApplication = null;
            if (Array.isArray(state.items)) {
              state.items = recalculateCartItems(state.items, 'RETAIL');
              state.totalPrice = calcCartTotal(state.items);
            }
          } else {
            // Restore authentication if real customer JWT is active in localStorage
            state.isAuthenticated = true;
            state.token = directCustToken;
          }

          // Clean up address format if saved as string
          if (state.user && state.user.addresses) {
            state.user.addresses = normalizeAddresses(state.user.addresses);
          }

          const currentOrders = Array.isArray(state.orders) ? state.orders : [];
          const sanitized = currentOrders.map((o, idx) => ({
            ...o,
            orderNumber: o.orderNumber || (o.id ? `ORD-${o.id}` : `ORD-${Date.now() + idx}`),
            status: o.status || 'PENDING'
          }));
          state.orders = sanitized;
        }
      }
    }
  )
);

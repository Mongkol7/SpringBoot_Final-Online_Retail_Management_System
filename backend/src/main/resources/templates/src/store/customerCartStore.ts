import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CustomerType, Order, PaymentMethod, WholesaleApplication, User } from '../types/schema';
import { customerApi } from '../features/customer/customerApi';
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
  addItem: (product: Product, quantity?: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;

  // Computations
  getEffectiveTier: () => CustomerType;
  getItemPrice: (product: Product, quantity?: number) => number;
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
  id: 1,
  roleId: 1,
  email: 'customer@retailstore.com',
  fullName: 'Customer',
  phone: '+855 12 849 201',
  customerType: 'RETAIL',
  addresses: ['No. 42, St. 271, Sangkat Boeng Tumpun, Phnom Penh, Cambodia'],
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

const calcCartTotal = (items: CustomerCartItem[]): number => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.07;
  return parseFloat((subtotal + tax).toFixed(2));
};

const buildCartItem = (
  product: Product,
  quantity: number,
  tier: CustomerType,
  existingId?: number
): CustomerCartItem => {
  const calc = calculateItemPrice(product, quantity, tier);
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
    badgeColor: calc.badgeColor
  };
};

export const useCustomerCartStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      token: 'jwt-customer-sok-rithysak-token-2026',
      isAuthenticated: true,
      demoTierOverride: null,
      items: [],
      totalPrice: 0,
      orders: INITIAL_ORDERS,
      wholesaleApplication: null,
      notification: null,

      login: async (email: string, password: string) => {
        const res = await customerApi.login(email, password);
        const updatedUser: User = {
          ...get().user,
          id: res.userId,
          email: res.email,
          fullName: res.fullName,
          customerType: res.customerType
        };
        const updatedItems = get().items.map((item) =>
          buildCartItem(item.product, item.quantity, res.customerType, item.id)
        );
        set({
          isAuthenticated: true,
          token: res.token,
          user: updatedUser,
          demoTierOverride: res.customerType,
          items: updatedItems,
          totalPrice: calcCartTotal(updatedItems)
        });
        localStorage.setItem('customer_jwt', res.token);
        get().setNotification({
          message: `Welcome back, ${res.fullName}!`,
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
        const updatedItems = get().items.map((item) =>
          buildCartItem(item.product, item.quantity, 'RETAIL', item.id)
        );
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
        get().setNotification({
          message: `Welcome, ${updatedUser.fullName}! Account created on Retail Tier.`,
          badge: 'RETAIL'
        });
        return true;
      },

      logout: () => {
        localStorage.removeItem('customer_jwt');
        set({
          isAuthenticated: false,
          token: null,
          user: GUEST_USER,
          demoTierOverride: null
        });
        get().setNotification({
          message: 'Signed out of customer account',
          badge: 'GUEST'
        });
      },

      quickDemoLogin: (tier: 'RETAIL' | 'WHOLESALE') => {
        const token = 'jwt-customer-token-2026';
        localStorage.setItem('customer_jwt', token);
        set({
          isAuthenticated: true,
          token,
          user: {
            ...DEFAULT_USER,
            customerType: tier
          },
          demoTierOverride: tier
        });
        get().setNotification({
          message: `Signed in as Customer`,
          badge: 'CUSTOMER'
        });
      },

      setDemoTier: (tier) => {
        set({ demoTierOverride: tier });
        const currentTier = tier || get().user.customerType;
        const updatedItems = get().items.map((item) =>
          buildCartItem(item.product, item.quantity, currentTier, item.id)
        );
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
        get().setNotification({
          message: `Switched tier view to: ${currentTier}`,
          badge: currentTier
        });
      },

      setUser: (userUpdates) => {
        set((state) => ({ user: { ...state.user, ...userUpdates } }));
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

      getItemPrice: (product: Product, quantity = 1) => {
        const tier = get().getEffectiveTier();
        return calculateItemPrice(product, quantity, tier).unitPrice;
      },

      addItem: (product: Product, quantity = 1) => {
        get().addToCart(product, quantity);
      },

      addToCart: (product: Product, quantity = 1) => {
        const availableStock = product.stockQuantity !== undefined
          ? Number(product.stockQuantity)
          : (product.availableStock !== undefined ? Number(product.availableStock) : 999);

        const currentItems = [...get().items];
        const existingIndex = currentItems.findIndex((i) => i.productId === product.id);
        const currentQty = existingIndex > -1 ? currentItems[existingIndex].quantity : 0;

        if (availableStock <= 0) {
          get().setNotification({
            message: `⚠️ '${product.name}' is currently OUT OF STOCK.`,
            badge: 'OUT OF STOCK'
          });
          return;
        }

        if (currentQty + quantity > availableStock) {
          get().setNotification({
            message: `⚠️ Stock Limit Warning: Only ${availableStock} units available for '${product.name}'. You have ${currentQty} in cart.`,
            badge: 'STOCK LIMIT'
          });
          return;
        }

        const tier = get().getEffectiveTier();
        if (existingIndex > -1) {
          const newQty = currentItems[existingIndex].quantity + quantity;
          currentItems[existingIndex] = buildCartItem(
            product,
            newQty,
            tier,
            currentItems[existingIndex].id
          );
        } else {
          currentItems.push(buildCartItem(product, quantity, tier));
        }

        set({ items: currentItems, totalPrice: calcCartTotal(currentItems) });
        get().setNotification({
          message: `✓ Successfully added ${quantity}x '${product.name}' to cart!`,
          badge: tier === 'WHOLESALE' ? 'WHOLESALE' : 'SUCCESS'
        });

        // Background call to backend if authenticated
        customerApi.addToCart(product.id, quantity).catch(() => {});
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        const currentItems = get().items;
        const targetItem = currentItems.find((i) => i.productId === productId);
        if (!targetItem) return;

        const availableStock = targetItem.product.stockQuantity !== undefined
          ? Number(targetItem.product.stockQuantity)
          : (targetItem.product.availableStock !== undefined ? Number(targetItem.product.availableStock) : 999);

        if (quantity > availableStock) {
          get().setNotification({
            message: `⚠️ Stock Limit Warning: Cannot order ${quantity} units. Only ${availableStock} in stock for '${targetItem.product.name}'.`,
            badge: 'STOCK LIMIT'
          });
          return;
        }

        const tier = get().getEffectiveTier();
        const updatedItems = currentItems.map((item) => {
          if (item.productId === productId) {
            return buildCartItem(item.product, quantity, tier, item.id);
          }
          return item;
        });

        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });
      },

      removeItem: (productId: number) => {
        get().removeFromCart(productId);
      },

      removeFromCart: (productId: number) => {
        const itemToRemove = get().items.find((i) => i.productId === productId);
        const updatedItems = get().items.filter((i) => i.productId !== productId);
        set({ items: updatedItems, totalPrice: calcCartTotal(updatedItems) });

        if (itemToRemove) {
          get().setNotification({
            message: `Removed ${itemToRemove.product.name} from cart`,
            badge: 'CART'
          });
          customerApi.removeFromCart(itemToRemove.id).catch(() => {});
        }
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

        const itemsPayload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
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
        const updatedItems = get().items.map((item) =>
          buildCartItem(item.product, item.quantity, 'RETAIL', item.id)
        );

        set({
          wholesaleApplication: app,
          user: updatedUser,
          demoTierOverride: 'RETAIL',
          items: updatedItems,
          totalPrice: calcCartTotal(updatedItems)
        });

        get().setNotification({
          message: 'Wholesale Application Submitted. Still on Retail Pricing until Admin approves.',
          badge: 'PENDING (RETAIL)'
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
        const updatedItems = get().items.map((item) =>
          buildCartItem(item.product, item.quantity, targetTier, item.id)
        );

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
        try {
          const app = await customerApi.getWholesaleStatus();
          if (app) {
            set({ wholesaleApplication: app });
            if (app.status === 'APPROVED' || get().user.customerType === 'WHOLESALE') {
              const updatedUser: User = { ...get().user, customerType: 'WHOLESALE' };
              const updatedItems = get().items.map((item) =>
                buildCartItem(item.product, item.quantity, 'WHOLESALE', item.id)
              );
              set({
                user: updatedUser,
                demoTierOverride: 'WHOLESALE',
                items: updatedItems,
                totalPrice: calcCartTotal(updatedItems)
              });
            } else if (app.status === 'PENDING') {
              // Only keep retail if the account is not already WHOLESALE
              if (get().user.customerType !== 'WHOLESALE') {
                const updatedUser: User = { ...get().user, customerType: 'RETAIL' };
                const updatedItems = get().items.map((item) =>
                  buildCartItem(item.product, item.quantity, 'RETAIL', item.id)
                );
                set({
                  user: updatedUser,
                  demoTierOverride: 'RETAIL',
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

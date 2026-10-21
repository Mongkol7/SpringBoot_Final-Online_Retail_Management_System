import axios from 'axios';
import { Product, CartItem, Order, WholesaleApplication, PaymentMethod } from '../../types/schema';
import { MOCK_BATCHES, MOCK_CATEGORIES, MOCK_PRODUCTS } from '../inventory/mocks/mockInventoryData';

const API_BASE = '/api/v1';

// Seeded products matching Flyway V5_1__seed_products_and_batches.sql
export const LEGACY_DEFAULT_CUSTOMER_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 2,
    sku: 'SKU-ENERGY-BAR',
    name: 'Organic Energy Bar (Almond & Honey)',
    description: 'Raw cold-pressed almond butter with wildflower honey and sprouted quinoa flakes.',
    imageUrl: '/products/energy-bar.jpg',
    costPrice: 1.80,
    wholesalePrice: 2.50,
    retailPrice: 3.50,
    minStockThreshold: 10,
    isPerishable: true,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 2,
    categoryId: 1,
    sku: 'SKU-COLD-BREW',
    name: 'Artisan Cold Brew Coffee 330ml',
    description: 'Steeped for 20 hours with Ethiopian single-origin beans, zero acidity.',
    imageUrl: '/products/cold-brew.jpg',
    costPrice: 2.20,
    wholesalePrice: 3.20,
    retailPrice: 4.75,
    minStockThreshold: 10,
    isPerishable: true,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 3,
    categoryId: 1,
    sku: 'SKU-SPARKLING-H2O',
    name: 'Sparkling Mineral Water 500ml',
    description: 'Naturally carbonated spring water bottled at the source in recycled glass.',
    imageUrl: '/products/sparkling-water.jpg',
    costPrice: 0.80,
    wholesalePrice: 1.40,
    retailPrice: 2.25,
    minStockThreshold: 15,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 4,
    categoryId: 2,
    sku: 'SKU-CHIP-TRUFFLE',
    name: 'Handcrafted Truffle Potato Crisps',
    description: 'Slow-cooked artisanal crisps dusted with black summer truffle and pink Himalayan salt.',
    imageUrl: '/products/truffle-chips.jpg',
    costPrice: 2.50,
    wholesalePrice: 3.80,
    retailPrice: 5.50,
    minStockThreshold: 10,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 5,
    categoryId: 3,
    sku: 'SKU-OAT-MILK',
    name: 'Barista Organic Oat Milk 1L',
    description: 'Steams to micro-foam perfection, made from gluten-free non-GMO whole oats.',
    imageUrl: '/products/oat-milk.jpg',
    costPrice: 2.10,
    wholesalePrice: 3.00,
    retailPrice: 4.20,
    minStockThreshold: 10,
    isPerishable: true,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 6,
    categoryId: 2,
    sku: 'SKU-DARK-CHOC',
    name: 'Single Origin 85% Dark Chocolate',
    description: 'Ecuadorian Arriba Nacional cacao with subtle floral notes, vegan and fair trade.',
    imageUrl: '/products/dark-chocolate.jpg',
    costPrice: 3.00,
    wholesalePrice: 4.20,
    retailPrice: 6.00,
    minStockThreshold: 10,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 7,
    categoryId: 4,
    sku: 'SKU-PROTEIN-WHEY',
    name: 'Vanilla Whey Protein Concentrate 1kg',
    description: 'Grass-fed native whey with natural vanilla bean, 25g protein per scoop.',
    imageUrl: '/products/whey-protein.jpg',
    costPrice: 22.00,
    wholesalePrice: 29.00,
    retailPrice: 38.00,
    minStockThreshold: 5,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 8,
    categoryId: 1,
    sku: 'SKU-MATCHA-LATTE',
    name: 'Ceremonial Grade Matcha Can 250ml',
    description: 'First harvest Uji matcha infused with creamy almond milk, gently sweetened.',
    imageUrl: '/products/matcha-latte.jpg',
    costPrice: 2.60,
    wholesalePrice: 3.60,
    retailPrice: 5.00,
    minStockThreshold: 12,
    isPerishable: true,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 9,
    categoryId: 2,
    sku: 'SKU-CHEDDAR-PUFFS',
    name: 'Cheesy Explosion Baked Cheddar Puffs',
    description: 'Wisconsin cheddar baked puffs and crispy golden nacho triangles.',
    imageUrl: '/products/cheddar-puffs.jpg',
    costPrice: 2.20,
    wholesalePrice: 3.20,
    retailPrice: 4.50,
    minStockThreshold: 15,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 10,
    categoryId: 2,
    sku: 'SKU-SPICY-LIME',
    name: 'Spicy Chili Lime Artisanal Crisps',
    description: 'Fiery roasted habanero chili crunches paired with tangy Mexican lime zest.',
    imageUrl: '/products/spicy-crisps.jpg',
    costPrice: 2.40,
    wholesalePrice: 3.50,
    retailPrice: 5.25,
    minStockThreshold: 15,
    isPerishable: false,
    isDeleted: false,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  }
];

export const LEGACY_CATEGORIES_LIST = [
  { id: 0, name: 'All Products' },
  { id: 1, name: 'Beverages' },
  { id: 2, name: 'Snacks' },
  { id: 3, name: 'Dairy & Plant Milk' },
  { id: 4, name: 'Nutrition & Supplements' }
];

// Keep the offline storefront preview on the same catalog used by the stock controller.
// Live mode still comes from /api/v1/customer/products, backed by the same database.
export const DEFAULT_CUSTOMER_PRODUCTS: Product[] = MOCK_PRODUCTS.map((p) => ({
  id: p.id,
  categoryId: p.categoryId ?? p.category?.id ?? 0,
  sku: p.sku,
  name: p.name,
  description: p.description,
  imageUrl: p.imageUrl,
  costPrice: p.costPrice,
  retailPrice: p.retailPrice,
  wholesalePrice: p.wholesalePrice,
  minStockThreshold: p.minStockThreshold,
  isPerishable: p.isPerishable,
  isDeleted: Boolean(p.isDeleted),
  createdAt: '',
  updatedAt: ''
}));

export const CATEGORIES_LIST = [
  { id: 0, name: 'All Products' },
  ...MOCK_CATEGORIES.map(({ id, name }) => ({ id, name }))
];

function getFallbackStock(productId: number): number {
  const today = new Date().toISOString().slice(0, 10);
  return MOCK_BATCHES
    .filter((batch) =>
      batch.product?.id === productId &&
      !batch.isExpired &&
      batch.currentQuantity > 0 &&
      (!batch.expiryDate || batch.expiryDate > today)
    )
    .reduce((total, batch) => total + Number(batch.currentQuantity || 0), 0);
}

function withFallbackStock(product: Product): Product {
  const stock = getFallbackStock(product.id);
  return { ...product, stockQuantity: stock, availableStock: stock };
}

// Helper to get auth headers from localStorage across personas
function getAuthHeaders(): { headers: Record<string, string> } {
  const token =
    localStorage.getItem('customer_jwt') ||
    localStorage.getItem('admin_jwt') ||
    localStorage.getItem('inventory_jwt') ||
    localStorage.getItem('cashier_jwt') ||
    localStorage.getItem('jwt_token') ||
    '';
  if (token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }
  return { headers: {} };
}

function normalizeOrder(raw: any): Order {
  if (!raw) return raw;
  const orderNumber = raw.orderNumber || raw.order_number || `ORD-${raw.id || Date.now()}`;
  return {
    ...raw,
    id: raw.id || Date.now(),
    orderNumber,
    status: raw.status || raw.orderStatus || 'PENDING',
    subtotal: raw.subtotal !== undefined ? Number(raw.subtotal) : 0,
    taxAmount: raw.taxAmount !== undefined ? Number(raw.taxAmount) : (raw.tax_amount !== undefined ? Number(raw.tax_amount) : 0),
    totalAmount: raw.totalAmount !== undefined ? Number(raw.totalAmount) : (raw.total_amount !== undefined ? Number(raw.total_amount) : 0),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    pricingTierUsed: raw.pricingTierUsed || raw.pricing_tier_used || 'RETAIL',
    shippingAddress: raw.shippingAddress || raw.shipping_address || 'Customer Delivery Address',
    items: Array.isArray(raw.items)
      ? raw.items.map((i: any) => ({
          ...i,
          unitPrice: i.unitPrice !== undefined ? Number(i.unitPrice) : (i.unit_price !== undefined ? Number(i.unit_price) : 0),
          subtotal: i.subtotal !== undefined ? Number(i.subtotal) : 0
        }))
      : []
  };
}

export function normalizeProduct(p: any): Product {
  const stock = p.stockQuantity !== undefined
    ? Number(p.stockQuantity)
    : (p.availableStock !== undefined ? Number(p.availableStock) : 0);

  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images;
  } else if (typeof p.images === 'string' && p.images.trim()) {
    try {
      const parsed = JSON.parse(p.images);
      images = Array.isArray(parsed) ? parsed : [p.images];
    } catch {
      images = p.images.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  } else if (p.imageUrl || p.image_url) {
    images = [p.imageUrl || p.image_url];
  }

  const primaryImage = images.length > 0 ? images[0] : (p.imageUrl || p.image_url || '');

  return {
    ...p,
    id: Number(p.id),
    name: p.name || 'Artisanal Snack Product',
    sku: p.sku || `SKU-${p.id}`,
    description: p.description || '',
    categoryId: p.categoryId ?? p.category?.id ?? 2,
    imageUrl: primaryImage,
    costPrice: Number(p.costPrice || 0),
    retailPrice: Number(p.retailPrice || 0),
    wholesalePrice: Number(p.wholesalePrice || 0),
    minStockThreshold: p.minStockThreshold !== undefined ? Number(p.minStockThreshold) : 10,
    wholesaleMinQty: p.wholesaleMinQty !== undefined ? Number(p.wholesaleMinQty) : 10,
    isPerishable: Boolean(p.isPerishable),
    isDeleted: Boolean(p.isDeleted),
    stockQuantity: stock,
    availableStock: stock
  };
}

export const customerApi = {
  // Products (Direct from central PostgreSQL DB - synchronized with Stock Controller)
  async getProducts(): Promise<Product[]> {
    try {
      const res = await axios.get(`${API_BASE}/customer/products`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((p: any) => normalizeProduct(p));
      }
    } catch {
      // Fallback 1: Public products endpoint
      try {
        const fallbackRes = await axios.get(`${API_BASE}/products`);
        const list = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : (fallbackRes.data?.content && Array.isArray(fallbackRes.data.content) ? fallbackRes.data.content : []);
        if (list.length > 0) {
          return list.map((p: any) => normalizeProduct(p));
        }
      } catch {
        // Fallback 2: Inventory products if staff/admin token is present
        try {
          const invToken = localStorage.getItem('inventory_jwt') || localStorage.getItem('customer_jwt');
          if (invToken) {
            const invRes = await axios.get(`${API_BASE}/inventory/products`, {
              headers: { Authorization: `Bearer ${invToken}` }
            });
            if (Array.isArray(invRes.data) && invRes.data.length > 0) {
              return invRes.data.map((p: any) => normalizeProduct(p));
            }
          }
        } catch {
          // Continue to fallback
        }
      }
    }
    return DEFAULT_CUSTOMER_PRODUCTS.map(withFallbackStock);
  },

  // Get single product by ID (Direct from DB with live batch calculation)
  async getProductById(id: number | string): Promise<Product | null> {
    const numId = Number(id);
    if (!numId) return null;

    try {
      const res = await axios.get(`${API_BASE}/customer/products/${numId}`);
      if (res.data) {
        return normalizeProduct(res.data);
      }
    } catch {
      try {
        const fallbackRes = await axios.get(`${API_BASE}/products/${numId}`);
        if (fallbackRes.data) {
          return normalizeProduct(fallbackRes.data);
        }
      } catch {
        try {
          const invToken = localStorage.getItem('inventory_jwt') || localStorage.getItem('customer_jwt');
          if (invToken) {
            const invRes = await axios.get(`${API_BASE}/inventory/products/${numId}`, {
              headers: { Authorization: `Bearer ${invToken}` }
            });
            if (invRes.data) {
              return normalizeProduct(invRes.data);
            }
          }
        } catch {
          // Fallback to in-memory search
        }
      }
    }

    // Fallback: search in seeded list
    const found = DEFAULT_CUSTOMER_PRODUCTS.find((p) => p.id === numId);
    if (found) {
      return withFallbackStock(found);
    }
    return null;
  },

  // Cart
  async getCart(): Promise<CartItem[]> {
    try {
      const res = await axios.get(`${API_BASE}/customer/cart`, getAuthHeaders());
      return res.data;
    } catch {
      return [];
    }
  },

  async addToCart(productId: number, quantity: number): Promise<CartItem | null> {
    try {
      const res = await axios.post(
        `${API_BASE}/customer/cart/items`,
        { productId, quantity },
        getAuthHeaders()
      );
      return res.data;
    } catch {
      return null;
    }
  },

  async removeFromCart(cartItemId: number): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE}/customer/cart/items/${cartItemId}`, getAuthHeaders());
      return true;
    } catch {
      return false;
    }
  },

  async clearCart(): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE}/customer/cart`, getAuthHeaders());
      return true;
    } catch {
      return false;
    }
  },

  // Checkout / Create Order
  async checkout(
    shippingAddress: string,
    paymentMethod: PaymentMethod,
    recipientName?: string,
    recipientPhone?: string,
    items?: Array<{ productId: number; quantity: number }>
  ): Promise<Order> {
    const payload = { shippingAddress, paymentMethod, recipientName, recipientPhone, items };
    try {
      const res = await axios.post(
        `${API_BASE}/customer/orders`,
        payload,
        getAuthHeaders()
      );
      return normalizeOrder(res.data);
    } catch {
      try {
        const fallbackRes = await axios.post(
          `${API_BASE}/customer/checkout`,
          payload,
          getAuthHeaders()
        );
        return normalizeOrder(fallbackRes.data);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || err.message || 'Checkout failed');
      }
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await axios.get(`${API_BASE}/customer/orders`, getAuthHeaders());
      return Array.isArray(res.data) ? res.data.map(normalizeOrder) : [];
    } catch {
      return [];
    }
  },

  async getOrder(orderNumber: string): Promise<Order | null> {
    try {
      const res = await axios.get(`${API_BASE}/customer/orders/${orderNumber}`, getAuthHeaders());
      return res.data ? normalizeOrder(res.data) : null;
    } catch {
      return null;
    }
  },

  async cancelOrder(orderIdOrNumber: string | number): Promise<boolean> {
    try {
      await axios.put(`${API_BASE}/customer/orders/${orderIdOrNumber}/cancel`, {}, getAuthHeaders());
      return true;
    } catch {
      try {
        await axios.post(`${API_BASE}/customer/orders/${orderIdOrNumber}/cancel`, {}, getAuthHeaders());
        return true;
      } catch {
        return false;
      }
    }
  },

  async confirmOrder(orderIdOrNumber: string | number): Promise<Order | null> {
    try {
      const res = await axios.post(`${API_BASE}/customer/orders/${orderIdOrNumber}/confirm`, {}, getAuthHeaders());
      return res.data ? normalizeOrder(res.data) : null;
    } catch {
      try {
        const fallbackRes = await axios.post(`${API_BASE}/admin/orders/${orderIdOrNumber}/confirm`, {}, getAuthHeaders());
        return fallbackRes.data ? normalizeOrder(fallbackRes.data) : null;
      } catch {
        return null;
      }
    }
  },

  // Wholesale
  async applyWholesale(
    companyName: string,
    taxId: string,
    contactDetails?: string,
    reason?: string
  ): Promise<WholesaleApplication> {
    const payload = {
      companyName,
      businessName: companyName,
      taxId,
      taxIdOrLicense: taxId,
      contactDetails,
      reason
    };
    try {
      const res = await axios.post(
        `${API_BASE}/customer/wholesale-request`,
        payload,
        getAuthHeaders()
      );
      return res.data;
    } catch {
      try {
        const fallbackRes = await axios.post(
          `${API_BASE}/customer/wholesale-apply`,
          payload,
          getAuthHeaders()
        );
        return fallbackRes.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || err.message || 'Wholesale application failed');
      }
    }
  },

  async getWholesaleStatus(): Promise<WholesaleApplication | null> {
    try {
      const res = await axios.get(`${API_BASE}/customer/wholesale-status`, getAuthHeaders());
      return res.data;
    } catch {
      return null;
    }
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; userId: number; email: string; fullName: string; role: string; customerType: 'RETAIL' | 'WHOLESALE' }> {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please verify your details.';
      throw new Error(msg);
    }
  },

  async register(email: string, password: string, fullName: string, phone: string): Promise<any> {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { email, password, fullName, phone });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.';
      throw new Error(msg);
    }
  }
};


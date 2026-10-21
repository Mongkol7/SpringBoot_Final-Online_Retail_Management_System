import { StockCategory, StockProduct, StockSupplier, StockBatch, StockTransaction } from '../../../services/inventoryService';

const getDayOffset = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const MOCK_CATEGORIES: StockCategory[] = [
  { id: 1, name: 'Beverages', description: 'Cold brew, organic teas, spring water, and barista milks' },
  { id: 2, name: 'Pantry & Grains', description: 'Gourmet rice, organic rolled oats, and kitchen essentials' },
  { id: 3, name: 'Fresh & Dairy', description: 'Artisanal yogurts, plant-based spreads, and cheeses' },
  { id: 4, name: 'Healthy Snacks', description: 'Cacao energy bites, roasted trail mix, and granola' },
  { id: 5, name: 'Personal Care', description: 'Eco-certified botanical soaps and body balms' }
];

export const MOCK_SUPPLIERS: StockSupplier[] = [
  {
    id: 1,
    name: 'Mekong Organic Agri-Trade',
    contactName: 'Sokha Chan',
    email: 'orders@mekongorganic.kh',
    phone: '+855 12 555 018',
    address: 'Street 214, Khan Daun Penh, Phnom Penh'
  },
  {
    id: 2,
    name: 'Northstar Nordic Roasters',
    contactName: 'Dara Lim',
    email: 'supply@northstarfoods.co',
    phone: '+855 10 284 610',
    address: 'Sen Sok Tech Park, Phnom Penh'
  },
  {
    id: 3,
    name: 'Kandal Farmstead Co.',
    contactName: 'Maly Vann',
    email: 'deliveries@kandalfarmstead.com',
    phone: '+855 98 310 442',
    address: 'National Highway 1, Kandal Province'
  },
  {
    id: 4,
    name: 'EcoBotanica Laboratories',
    contactName: 'Vanna Keo',
    email: 'trade@ecobotanica.asia',
    phone: '+855 11 889 203',
    address: 'BKK1, Phnom Penh'
  }
];

export const MOCK_PRODUCTS: StockProduct[] = [
  {
    id: 1,
    sku: 'SKU-ENERGY-BAR',
    name: 'Organic Energy Bar (Almond & Honey)',
    description: 'Raw cold-pressed almond butter with wildflower honey. 100% organic, non-GMO.',
    imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[3],
    categoryId: 4,
    costPrice: 1.80,
    wholesalePrice: 2.50,
    retailPrice: 3.50,
    minStockThreshold: 15,
    isPerishable: true,
    isDeleted: false
  },
  {
    id: 2,
    sku: 'DRK-CB-002',
    name: 'Single Origin Nitro Cold Brew',
    description: 'Slow-steeped Arabica blend canned with nitrogen for a velvety micro-foam.',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[0],
    categoryId: 1,
    costPrice: 1.65,
    wholesalePrice: 2.45,
    retailPrice: 3.85,
    minStockThreshold: 12,
    isPerishable: true,
    isDeleted: false
  },
  {
    id: 3,
    sku: 'FRS-OAT-003',
    name: 'Barista Reserve Oat Milk (1L)',
    description: 'Specially formulated for silken latte foam without curdling. Gluten-free.',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[2],
    categoryId: 3,
    costPrice: 1.50,
    wholesalePrice: 2.20,
    retailPrice: 3.25,
    minStockThreshold: 20,
    isPerishable: true,
    isDeleted: false
  },
  {
    id: 4,
    sku: 'PAN-RICE-004',
    name: 'Royal Jasmine Fragrant Rice (5kg)',
    description: 'Premium fragrant Cambodian Phkar Rumduol jasmine rice, harvested once a year.',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[1],
    categoryId: 2,
    costPrice: 5.20,
    wholesalePrice: 7.20,
    retailPrice: 9.80,
    minStockThreshold: 10,
    isPerishable: false,
    isDeleted: false
  },
  {
    id: 5,
    sku: 'PAN-OATS-005',
    name: 'Steel Cut Organic Rolled Oats (1kg)',
    description: 'High-fiber slow-cooking whole grain oats from organic cooperative farms.',
    imageUrl: 'https://images.unsplash.com/photo-1614961908595-5db4f36402ec?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[1],
    categoryId: 2,
    costPrice: 2.10,
    wholesalePrice: 3.00,
    retailPrice: 4.50,
    minStockThreshold: 12,
    isPerishable: false,
    isDeleted: false
  },
  {
    id: 6,
    sku: 'FRS-YOG-006',
    name: 'Cultured Greek Yogurt with Wild Berries (500g)',
    description: 'Triple-strained whole milk probiotic yogurt with organic wild berry purée.',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[2],
    categoryId: 3,
    costPrice: 1.40,
    wholesalePrice: 2.10,
    retailPrice: 3.20,
    minStockThreshold: 18,
    isPerishable: true,
    isDeleted: false
  },
  {
    id: 7,
    sku: 'DRK-SPR-007',
    name: 'Sparkling Mineral Spring Water (750ml)',
    description: 'Naturally carbonated volcanic spring water bottled at the source.',
    imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[0],
    categoryId: 1,
    costPrice: 0.60,
    wholesalePrice: 0.95,
    retailPrice: 1.50,
    minStockThreshold: 24,
    isPerishable: false,
    isDeleted: false
  },
  {
    id: 8,
    sku: 'SNK-CHOC-008',
    name: 'Single Estate Dark Chocolate 72% (100g)',
    description: 'Stone-ground artisanal cocoa beans with unrefined cane sugar crystals.',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    category: MOCK_CATEGORIES[3],
    categoryId: 4,
    costPrice: 2.30,
    wholesalePrice: 3.40,
    retailPrice: 4.90,
    minStockThreshold: 10,
    isPerishable: false,
    isDeleted: false
  }
];

export const MOCK_BATCHES: StockBatch[] = [
  {
    id: 1,
    batchCode: 'BATCH-ENGBAR-01',
    product: MOCK_PRODUCTS[0],
    supplier: MOCK_SUPPLIERS[0],
    initialQuantity: 60,
    currentQuantity: 8, // Low stock: 8 <= 15
    expiryDate: getDayOffset(4), // Expiring soon in 4 days!
    isExpired: false,
    receivedAt: getDayOffset(-14)
  },
  {
    id: 2,
    batchCode: 'BATCH-ENGBAR-02',
    product: MOCK_PRODUCTS[0],
    supplier: MOCK_SUPPLIERS[0],
    initialQuantity: 40,
    currentQuantity: 40,
    expiryDate: getDayOffset(45), // Future batch
    isExpired: false,
    receivedAt: getDayOffset(-3)
  },
  {
    id: 3,
    batchCode: 'BATCH-COLDBREW-A',
    product: MOCK_PRODUCTS[1],
    supplier: MOCK_SUPPLIERS[1],
    initialQuantity: 48,
    currentQuantity: 6, // Low stock: 6 <= 12
    expiryDate: getDayOffset(2), // Expiring soon in 2 days!
    isExpired: false,
    receivedAt: getDayOffset(-10)
  },
  {
    id: 4,
    batchCode: 'BATCH-COLDBREW-B',
    product: MOCK_PRODUCTS[1],
    supplier: MOCK_SUPPLIERS[1],
    initialQuantity: 50,
    currentQuantity: 50,
    expiryDate: getDayOffset(28),
    isExpired: false,
    receivedAt: getDayOffset(-2)
  },
  {
    id: 5,
    batchCode: 'BATCH-OATMILK-88',
    product: MOCK_PRODUCTS[2],
    supplier: MOCK_SUPPLIERS[2],
    initialQuantity: 36,
    currentQuantity: 24,
    expiryDate: getDayOffset(18),
    isExpired: false,
    receivedAt: getDayOffset(-6)
  },
  {
    id: 6,
    batchCode: 'BATCH-RICE-2026',
    product: MOCK_PRODUCTS[3],
    supplier: MOCK_SUPPLIERS[0],
    initialQuantity: 80,
    currentQuantity: 52,
    expiryDate: undefined, // Non-perishable FIFO
    isExpired: false,
    receivedAt: getDayOffset(-30)
  },
  {
    id: 7,
    batchCode: 'BATCH-OATS-NORD',
    product: MOCK_PRODUCTS[4],
    supplier: MOCK_SUPPLIERS[1],
    initialQuantity: 40,
    currentQuantity: 7, // Low stock: 7 <= 12
    expiryDate: undefined,
    isExpired: false,
    receivedAt: getDayOffset(-22)
  },
  {
    id: 8,
    batchCode: 'BATCH-YOGURT-EX1',
    product: MOCK_PRODUCTS[5],
    supplier: MOCK_SUPPLIERS[2],
    initialQuantity: 30,
    currentQuantity: 5,
    expiryDate: getDayOffset(-1), // Already expired!
    isExpired: true,
    receivedAt: getDayOffset(-12)
  },
  {
    id: 9,
    batchCode: 'BATCH-YOGURT-FRESH',
    product: MOCK_PRODUCTS[5],
    supplier: MOCK_SUPPLIERS[2],
    initialQuantity: 30,
    currentQuantity: 28,
    expiryDate: getDayOffset(6), // Expiring soon (6 days)
    isExpired: false,
    receivedAt: getDayOffset(-2)
  },
  {
    id: 10,
    batchCode: 'BATCH-SPRINGWTR-01',
    product: MOCK_PRODUCTS[6],
    supplier: MOCK_SUPPLIERS[0],
    initialQuantity: 120,
    currentQuantity: 96,
    expiryDate: undefined,
    isExpired: false,
    receivedAt: getDayOffset(-8)
  },
  {
    id: 11,
    batchCode: 'BATCH-CHOC-SINGLE',
    product: MOCK_PRODUCTS[7],
    supplier: MOCK_SUPPLIERS[1],
    initialQuantity: 50,
    currentQuantity: 44,
    expiryDate: getDayOffset(180),
    isExpired: false,
    receivedAt: getDayOffset(-15)
  }
];

export const MOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 1,
    batch: MOCK_BATCHES[1],
    user: { id: 1, fullName: 'Warehouse Manager', email: 'stock@retailstore.com' },
    type: 'STOCK_IN',
    quantityDelta: 40,
    reason: 'Replenishment delivery PO-2026-081',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    batch: MOCK_BATCHES[0],
    user: { id: 2, fullName: 'POS Terminal 01', email: 'cashier1@retailstore.com' },
    type: 'POS_SALE',
    quantityDelta: -4,
    reason: 'In-store walk-in POS order #POS-2603',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 3,
    batch: MOCK_BATCHES[3],
    user: { id: 1, fullName: 'Warehouse Manager', email: 'stock@retailstore.com' },
    type: 'STOCK_IN',
    quantityDelta: 50,
    reason: 'Direct shipment from Northstar Nordic Roasters',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 4,
    batch: MOCK_BATCHES[2],
    user: { id: 3, fullName: 'Online Storefront', email: 'customer@client.com' },
    type: 'ONLINE_SALE',
    quantityDelta: -6,
    reason: 'Web order #ORD-ONLINE-1092',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 5,
    batch: MOCK_BATCHES[7],
    user: { id: 1, fullName: 'Quality Inspector', email: 'audit@retailstore.com' },
    type: 'EXPIRED_WRITE_OFF',
    quantityDelta: -5,
    reason: 'Routine batch expiration write-off',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 6,
    batch: MOCK_BATCHES[6],
    user: { id: 1, fullName: 'Warehouse Staff', email: 'stock@retailstore.com' },
    type: 'MANUAL_ADJUSTMENT',
    quantityDelta: -2,
    reason: 'Damaged packaging during forklift relocation',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

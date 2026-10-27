import { Product, CustomerType } from '../types/schema';

export type DiscountType = 'NONE' | 'RETAIL_BULK' | 'WHOLESALE' | 'CLEARANCE' | 'MULTI_BATCH_CLEARANCE';

export interface ItemPriceCalculation {
  unitPrice: number;
  originalPrice: number;
  discountType: DiscountType;
  unitSavings: number;
  savings: number; // total savings across line item
  subtotal: number;
  neededForWholesale: number; // units needed to unlock wholesale price
  neededForRetailBulk: number; // units needed to unlock retail bulk discount
  minQty: number;
  discountPercent: number;
  badgeLabel?: string;
  badgeColor?: string;

  // Multi-batch allocation & clearance fields
  nearExpiryUnits?: number;
  freshUnits?: number;
  clearanceUnitPrice?: number;
  regularUnitPrice?: number;
  clearanceDiscountPercent?: number;
  batchAllocationSummary?: string;
  hasNearExpiryDiscount?: boolean;

  // Batch Preference & Availability (Supported for both Wholesale & Retail)
  canChooseBatch?: boolean;
  selectedBatchPreference?: 'FRESH' | 'CLEARANCE';
  hasBothBatches?: boolean;
  freshStockAvailable?: number;
  nearExpiryAvailable?: number;
  freshBatchExpiryDate?: string;
  freshBatchCode?: string;
}

export const DEFAULT_WHOLESALE_MIN_QTY = 10;
export const RETAIL_BULK_MIN_QTY = 10;
export const RETAIL_BULK_DISCOUNT_PERCENT = 5; // 5% discount

/**
 * Calculates tiered quantity-based & multi-batch pricing for a product line item:
 * 
 * Both WHOLESALE and RETAIL / Normal customers can choose between:
 * 1. GUARANTEED FRESH BATCH:
 *    - Draws exclusively from fresh batches with long shelf life / future expiry.
 *    - Billed at standard pricing (Wholesale price for wholesale, Retail price for retail).
 * 
 * 2. CLEARANCE BATCH (25% OFF):
 *    - Draws from short-dated stock (< 30 days) to clear inventory.
 *    - Wholesale receives 25% OFF Wholesale price.
 *    - Retail receives 25% OFF Retail price.
 * 
 * If only one batch exists in warehouse:
 * - If only near-expiry stock exists: clearance discount is applied automatically with a short-dated notice.
 * - If only fresh stock exists: standard fresh stock pricing applies.
 */
export function calculateItemPrice(
  product: Product,
  quantity: number,
  customerType: CustomerType,
  batchPreference?: 'FRESH' | 'CLEARANCE',
  totalProductQuantity?: number
): ItemPriceCalculation {
  const safeQty = Math.max(1, quantity);
  const minQty = product.wholesaleMinQty && product.wholesaleMinQty > 0
    ? product.wholesaleMinQty
    : DEFAULT_WHOLESALE_MIN_QTY;

  // Cross-batch product quantity aggregation:
  // If buyer has added units across multiple batches (e.g. 6 fresh + 4 clearance = 10 total of this product),
  // they qualify for wholesale tier pricing on both batches!
  const qualifyingQty = totalProductQuantity !== undefined && totalProductQuantity > 0
    ? totalProductQuantity
    : safeQty;

  const originalPrice = product.retailPrice;
  const isWholesaleTier = customerType === 'WHOLESALE';
  const qualifiesForWholesale = isWholesaleTier && qualifyingQty >= minQty;
  const neededForWholesale = isWholesaleTier ? Math.max(0, minQty - qualifyingQty) : 0;

  // Stock inventory checks
  const totalStock = product.stockQuantity !== undefined
    ? Number(product.stockQuantity)
    : (product.availableStock !== undefined ? Number(product.availableStock) : 999);

  const nearExpiryAvailable = product.nearExpiryQuantity && product.nearExpiryQuantity > 0
    ? product.nearExpiryQuantity
    : 0;

  const freshStockAvailable = product.freshStockQuantity !== undefined
    ? product.freshStockQuantity
    : Math.max(0, totalStock - nearExpiryAvailable);

  const hasBothBatches = nearExpiryAvailable > 0 && freshStockAvailable > 0;
  const clearanceDiscountPercent = product.clearanceDiscountPercent && product.clearanceDiscountPercent > 0
    ? product.clearanceDiscountPercent
    : 25;

  const expiryDateStr = product.currentBatchExpiryDate
    ? new Date(product.currentBatchExpiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'within 30 days';

  const freshExpiryStr = product.freshBatchExpiryDate
    ? new Date(product.freshBatchExpiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Long Shelf Life';

  // ==========================================
  // ==========================================
  // CASE A: WHOLESALE CUSTOMER TIER
  // ==========================================
  if (isWholesaleTier) {
    const wholesaleUnitPrice = product.wholesalePrice;
    const wholesaleClearanceUnitPrice = product.wholesaleClearancePrice && product.wholesaleClearancePrice > 0
      ? product.wholesaleClearancePrice
      : parseFloat((wholesaleUnitPrice * (1 - clearanceDiscountPercent / 100)).toFixed(2));

    const retailClearanceUnitPrice = product.clearancePrice && product.clearancePrice > 0
      ? product.clearancePrice
      : parseFloat((originalPrice * (1 - clearanceDiscountPercent / 100)).toFixed(2));

    // Determine batch preference:
    // If buyer passed batchPreference, honor it unconditionally.
    // Otherwise, default to 'CLEARANCE' if only near-expiry stock exists or short shelf life, otherwise 'FRESH'.
    const effectivePref: 'FRESH' | 'CLEARANCE' = batchPreference
      ? batchPreference
      : (freshStockAvailable === 0 && nearExpiryAvailable > 0)
        ? 'CLEARANCE'
        : (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0))
          ? 'CLEARANCE'
          : 'FRESH';

    // Branch A.2: Wholesale Choosing CLEARANCE BATCH
    if (effectivePref === 'CLEARANCE') {
      const unitPrice = qualifiesForWholesale ? wholesaleClearanceUnitPrice : retailClearanceUnitPrice;
      const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
      const totalOriginalRetail = parseFloat((originalPrice * safeQty).toFixed(2));
      const savings = Math.max(0, parseFloat((totalOriginalRetail - subtotal).toFixed(2)));
      const unitSavings = parseFloat((savings / safeQty).toFixed(2));
      const discountPercent = totalOriginalRetail > 0 ? Math.round((savings / totalOriginalRetail) * 100) : clearanceDiscountPercent;

      const batchAllocationSummary = qualifiesForWholesale
        ? `${safeQty}x Wholesale Clearance (${clearanceDiscountPercent}% OFF Wholesale · Exp: ${expiryDateStr})`
        : `${safeQty}x Clearance Batch (${clearanceDiscountPercent}% OFF · Exp: ${expiryDateStr} · Add ${neededForWholesale} more across batches for Wholesale)`;

      const badgeLabel = qualifiesForWholesale
        ? `${clearanceDiscountPercent}% OFF Wholesale Clearance`
        : `${clearanceDiscountPercent}% Clearance Retail (Wholesale at ${minQty}+)`;

      return {
        unitPrice,
        originalPrice: qualifiesForWholesale ? wholesaleUnitPrice : originalPrice,
        discountType: 'CLEARANCE',
        unitSavings,
        savings,
        subtotal,
        neededForWholesale,
        neededForRetailBulk: 0,
        minQty,
        discountPercent,
        badgeLabel,
        badgeColor: qualifiesForWholesale ? '#A855F7' : '#D97706',
        nearExpiryUnits: safeQty,
        freshUnits: 0,
        clearanceUnitPrice: qualifiesForWholesale ? wholesaleClearanceUnitPrice : retailClearanceUnitPrice,
        regularUnitPrice: qualifiesForWholesale ? wholesaleUnitPrice : originalPrice,
        clearanceDiscountPercent,
        batchAllocationSummary,
        hasNearExpiryDiscount: true,
        canChooseBatch: hasBothBatches || nearExpiryAvailable > 0,
        selectedBatchPreference: 'CLEARANCE',
        hasBothBatches,
        freshStockAvailable,
        nearExpiryAvailable,
        freshBatchExpiryDate: product.freshBatchExpiryDate,
        freshBatchCode: product.freshBatchCode
      };
    }

    // Branch A.1: Wholesale Choosing Guaranteed FRESH BATCH
    const unitPrice = qualifiesForWholesale ? wholesaleUnitPrice : originalPrice;
    const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
    const totalOriginalRetail = parseFloat((originalPrice * safeQty).toFixed(2));
    const savings = Math.max(0, parseFloat((totalOriginalRetail - subtotal).toFixed(2)));
    const unitSavings = parseFloat((savings / safeQty).toFixed(2));
    const discountPercent = totalOriginalRetail > 0 ? Math.round((savings / totalOriginalRetail) * 100) : 0;
    const discountType: DiscountType = qualifiesForWholesale ? 'WHOLESALE' : 'NONE';
    const badgeLabel = qualifiesForWholesale
      ? '✨ Wholesale Fresh Batch'
      : `Wholesale at ${minQty}+ (Add ${neededForWholesale} more)`;
    const badgeColor = qualifiesForWholesale ? '#30D158' : '#D97706';
    const batchAllocationSummary = qualifiesForWholesale
      ? `${safeQty}x Fresh Batch Guaranteed (Shelf Stable · Wholesale $${wholesaleUnitPrice.toFixed(2)} · Exp: ${freshExpiryStr})`
      : `${safeQty}x Fresh Batch (Standard Price $${originalPrice.toFixed(2)} · Exp: ${freshExpiryStr} · Add ${neededForWholesale} more across batches for Wholesale $${wholesaleUnitPrice.toFixed(2)})`;

    return {
      unitPrice,
      originalPrice,
      discountType,
      unitSavings,
      savings,
      subtotal,
      neededForWholesale,
      neededForRetailBulk: 0,
      minQty,
      discountPercent,
      badgeLabel,
      badgeColor,
      nearExpiryUnits: 0,
      freshUnits: safeQty,
      clearanceUnitPrice: qualifiesForWholesale ? wholesaleClearanceUnitPrice : retailClearanceUnitPrice,
      regularUnitPrice: qualifiesForWholesale ? wholesaleUnitPrice : originalPrice,
      clearanceDiscountPercent,
      batchAllocationSummary,
      hasNearExpiryDiscount: false,
      canChooseBatch: hasBothBatches || nearExpiryAvailable > 0,
      selectedBatchPreference: 'FRESH',
      hasBothBatches,
      freshStockAvailable,
      nearExpiryAvailable,
      freshBatchExpiryDate: product.freshBatchExpiryDate,
      freshBatchCode: product.freshBatchCode
    };
  }

  // ==========================================
  // CASE B: RETAIL CUSTOMER TIER (NORMAL USERS)
  // ==========================================
  const clearanceUnitPrice = product.clearancePrice && product.clearancePrice > 0
    ? product.clearancePrice
    : parseFloat((originalPrice * (1 - clearanceDiscountPercent / 100)).toFixed(2));

  // Determine effective batch preference for retail:
  // If user provided a choice, honor it unconditionally.
  const effectiveRetailPref: 'FRESH' | 'CLEARANCE' = batchPreference
    ? batchPreference
    : (freshStockAvailable === 0 && nearExpiryAvailable > 0)
      ? 'CLEARANCE'
      : (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0))
        ? 'CLEARANCE'
        : 'FRESH';

  // Branch B.2: Retail User Choosing CLEARANCE BATCH (25% OFF Retail)
  if (effectiveRetailPref === 'CLEARANCE') {
    const unitPrice = clearanceUnitPrice;
    const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
    const totalOriginal = parseFloat((originalPrice * safeQty).toFixed(2));
    const savings = Math.max(0, parseFloat((totalOriginal - subtotal).toFixed(2)));
    const unitSavings = parseFloat((savings / safeQty).toFixed(2));
    const discountPercent = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : clearanceDiscountPercent;

    const batchAllocationSummary = `${safeQty}x Clearance Batch (${clearanceDiscountPercent}% OFF · Exp: ${expiryDateStr})`;
    const badgeLabel = `${clearanceDiscountPercent}% Clearance OFF`;
    const discountType: DiscountType = 'CLEARANCE';

    return {
      unitPrice,
      originalPrice,
      discountType,
      unitSavings,
      savings,
      subtotal,
      neededForWholesale: minQty,
      neededForRetailBulk: 0,
      minQty,
      discountPercent,
      badgeLabel,
      badgeColor: '#FF9500',
      nearExpiryUnits: safeQty,
      freshUnits: 0,
      clearanceUnitPrice,
      regularUnitPrice: originalPrice,
      clearanceDiscountPercent,
      batchAllocationSummary,
      hasNearExpiryDiscount: true,
      canChooseBatch: hasBothBatches || nearExpiryAvailable > 0,
      selectedBatchPreference: 'CLEARANCE',
      hasBothBatches,
      freshStockAvailable,
      nearExpiryAvailable,
      freshBatchExpiryDate: product.freshBatchExpiryDate,
      freshBatchCode: product.freshBatchCode
    };
  }

  // Branch B.1: Retail User Choosing GUARANTEED FRESH STOCK
  const isRetailBulk = safeQty >= 10;
  const unitPrice = isRetailBulk ? parseFloat((originalPrice * 0.95).toFixed(2)) : originalPrice;
  const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
  const totalOriginal = parseFloat((originalPrice * safeQty).toFixed(2));
  const savings = Math.max(0, parseFloat((totalOriginal - subtotal).toFixed(2)));
  const unitSavings = parseFloat((savings / safeQty).toFixed(2));
  const discountPercent = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;

  return {
    unitPrice,
    originalPrice,
    discountType: isRetailBulk ? 'RETAIL_BULK' : 'NONE',
    unitSavings,
    savings,
    subtotal,
    neededForWholesale: minQty,
    neededForRetailBulk: isRetailBulk ? 0 : 10 - safeQty,
    minQty,
    discountPercent,
    badgeLabel: isRetailBulk ? 'Bulk Tier (-5%)' : (hasBothBatches ? '✨ Guaranteed Fresh Stock' : undefined),
    badgeColor: isRetailBulk ? '#2563EB' : '#30D158',
    nearExpiryUnits: 0,
    freshUnits: safeQty,
    clearanceUnitPrice,
    regularUnitPrice: originalPrice,
    clearanceDiscountPercent,
    batchAllocationSummary: hasBothBatches
      ? `${safeQty}x Guaranteed Fresh Batch (Standard Price $${originalPrice.toFixed(2)} · Exp: ${freshExpiryStr})`
      : undefined,
    hasNearExpiryDiscount: false,
    canChooseBatch: hasBothBatches || nearExpiryAvailable > 0,
    selectedBatchPreference: 'FRESH',
    hasBothBatches,
    freshStockAvailable,
    nearExpiryAvailable,
    freshBatchExpiryDate: product.freshBatchExpiryDate,
    freshBatchCode: product.freshBatchCode
  };
}

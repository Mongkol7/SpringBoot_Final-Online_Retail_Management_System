import { Product, CustomerType } from '../types/schema';

export type DiscountType = 'NONE' | 'RETAIL_BULK' | 'WHOLESALE';

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
}

export const DEFAULT_WHOLESALE_MIN_QTY = 10;
export const RETAIL_BULK_MIN_QTY = 10;
export const RETAIL_BULK_DISCOUNT_PERCENT = 5; // 5% discount

/**
 * Calculates tiered quantity-based pricing for a product line item:
 * 
 * 1. For WHOLESALE Customer:
 *    - qty >= wholesaleMinQty (default 10): applies wholesalePrice (full wholesale discount)
 *    - qty < wholesaleMinQty: retains standard retailPrice, calculates needed units to reach MOQ
 * 
 * 2. For RETAIL Customer:
 *    - qty >= 10: applies 5% bulk retail discount (guaranteeing wholesalePrice < bulkRetailPrice < retailPrice)
 *    - qty < 10: applies standard retailPrice
 */
export function calculateItemPrice(
  product: Product,
  quantity: number,
  customerType: CustomerType
): ItemPriceCalculation {
  const safeQty = Math.max(1, quantity);
  const minQty = product.wholesaleMinQty && product.wholesaleMinQty > 0
    ? product.wholesaleMinQty
    : DEFAULT_WHOLESALE_MIN_QTY;

  const originalPrice = product.retailPrice;

  // Case 1: WHOLESALE Customer Type
  if (customerType === 'WHOLESALE') {
    if (safeQty >= minQty) {
      // Eligible for full wholesale tier
      const unitPrice = product.wholesalePrice;
      const unitSavings = Math.max(0, parseFloat((originalPrice - unitPrice).toFixed(2)));
      const savings = parseFloat((unitSavings * safeQty).toFixed(2));
      const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
      const discountPercent = Math.round(((originalPrice - unitPrice) / originalPrice) * 100);

      return {
        unitPrice,
        originalPrice,
        discountType: 'WHOLESALE',
        unitSavings,
        savings,
        subtotal,
        neededForWholesale: 0,
        neededForRetailBulk: 0,
        minQty,
        discountPercent,
        badgeLabel: 'Wholesale Tier',
        badgeColor: '#30D158'
      };
    } else {
      // Wholesale account, but under MOQ: retain standard retail price
      const unitPrice = originalPrice;
      const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));
      const neededForWholesale = minQty - safeQty;

      return {
        unitPrice,
        originalPrice,
        discountType: 'NONE',
        unitSavings: 0,
        savings: 0,
        subtotal,
        neededForWholesale,
        neededForRetailBulk: 0,
        minQty,
        discountPercent: 0,
        badgeLabel: `Retained at Retail Price (Needs ${minQty}+ for Wholesale)`,
        badgeColor: '#FF9F0A'
      };
    }
  }

  // Case 2: RETAIL Customer Type (Standard / Guest Store Customers)
  // Standard retail customers always pay normal retail price.
  // Wholesale discounts are strictly reserved for approved WHOLESALE accounts.
  const unitPrice = originalPrice;
  const subtotal = parseFloat((unitPrice * safeQty).toFixed(2));

  return {
    unitPrice,
    originalPrice,
    discountType: 'NONE',
    unitSavings: 0,
    savings: 0,
    subtotal,
    neededForWholesale: minQty,
    neededForRetailBulk: 0,
    minQty,
    discountPercent: 0,
    badgeLabel: undefined,
    badgeColor: undefined
  };
}

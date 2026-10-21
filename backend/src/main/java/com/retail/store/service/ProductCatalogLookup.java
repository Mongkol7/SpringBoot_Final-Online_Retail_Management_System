package com.retail.store.service;

import java.math.BigDecimal;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 3 (STOCK_CONTROLLER Role Lead)
 * =========================================================================
 * Cross-role integration contract (Contract 2):
 * Allows Person 1 (Online Shop) and Person 2 (Cashier POS) to query product
 * prices across all 3 tiers (cost, retail, wholesale) and verify live stock.
 * =========================================================================
 */
public interface ProductCatalogLookup {

    /**
     * Look up pricing information and active stock for a given product ID.
     */
    ProductPriceDto getPrices(Long productId);

    /**
     * Checks if a product has active non-expired stock (> 0) and is not deleted.
     */
    boolean isProductAvailable(Long productId);

    record ProductPriceDto(
            Long productId,
            String sku,
            String name,
            BigDecimal costPrice,
            BigDecimal retailPrice,
            BigDecimal wholesalePrice,
            boolean isPerishable,
            int availableStock
    ) {}
}

package com.retail.store.service;

import com.retail.store.entity.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InventoryService extends BatchAllocationService {
    Category createCategory(String name, String description);
    Supplier createSupplier(String name, String contactName, String email, String phone, String address);
    Product createProduct(Integer categoryId, String sku, String name, String description,
                          String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                          BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable);
    ProductBatch stockIn(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate, Long staffUserId);
    List<Product> getLowStockAlerts();
    void markExpiredBatches();
}

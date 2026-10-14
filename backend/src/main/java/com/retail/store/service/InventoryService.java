package com.retail.store.service;

import com.retail.store.entity.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InventoryService extends BatchAllocationService, ProductCatalogLookup {
    // Categories CRUD
    Category createCategory(String name, String description);
    List<Category> getAllCategories();
    Category updateCategory(Integer categoryId, String name, String description);
    void deleteCategory(Integer categoryId);

    // Suppliers CRUD
    Supplier createSupplier(String name, String contactName, String email, String phone, String address);
    List<Supplier> getAllSuppliers();
    Supplier updateSupplier(Integer supplierId, String name, String contactName, String email, String phone, String address);
    void deleteSupplier(Integer supplierId);

    // Products CRUD & Soft-Delete Lifecycle
    Product createProduct(Integer categoryId, String sku, String name, String description,
                          String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                          BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable);
    Product updateProduct(Long productId, Integer categoryId, String name, String description,
                          String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                          BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable);
    Product getProductById(Long productId);
    List<Product> getAllActiveProducts();
    List<Product> getAllProducts(boolean includeDeleted);
    void deleteProduct(Long productId);
    Product restoreProduct(Long productId);

    // Batches & Stock-In
    ProductBatch stockIn(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate, Long staffUserId);
    List<ProductBatch> getBatchesByProduct(Long productId);
    List<ProductBatch> getAllBatches();

    // Radar Alerts & Stock Adjustments
    List<Product> getLowStockAlerts();
    List<ProductBatch> getExpiringBatches(int days);
    void markExpiredBatches();
    InventoryTransaction adjustStock(Long batchId, int quantityDelta, String reason, Long staffUserId);
    List<InventoryTransaction> getRecentTransactions();
}

package com.retail.store.controller;

import com.retail.store.entity.Category;
import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Product;
import com.retail.store.entity.ProductBatch;
import com.retail.store.entity.Supplier;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.InventoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ================= CATEGORIES =================
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CreateCategoryRequest request) {
        return new ResponseEntity<>(inventoryService.createCategory(request.name(), request.description()), HttpStatus.CREATED);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(inventoryService.getAllCategories());
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Integer id, @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(inventoryService.updateCategory(id, request.name(), request.description()));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        inventoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ================= SUPPLIERS =================
    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> createSupplier(@RequestBody CreateSupplierRequest request) {
        return new ResponseEntity<>(inventoryService.createSupplier(
                request.name(), request.contactName(), request.email(), request.phone(), request.address(), request.profileImage()), HttpStatus.CREATED);
    }

    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(inventoryService.getAllSuppliers());
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Integer id, @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.ok(inventoryService.updateSupplier(
                id, request.name(), request.contactName(), request.email(), request.phone(), request.address(), request.profileImage()));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Integer id) {
        inventoryService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }

    // ================= PRODUCTS =================
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody CreateProductRequest request) {
        Product product = inventoryService.createProduct(
                request.categoryId(), request.sku(), request.name(), request.description(),
                request.imageUrl(), request.images(), request.costPrice(), request.retailPrice(),
                request.wholesalePrice(), request.minStockThreshold(), request.isPerishable()
        );
        return new ResponseEntity<>(product, HttpStatus.CREATED);
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(inventoryService.getAllProducts(includeDeleted));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getProductById(id));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody UpdateProductRequest request) {
        Product updated = inventoryService.updateProduct(
                id, request.categoryId(), request.name(), request.description(),
                request.imageUrl(), request.images(), request.costPrice(), request.retailPrice(),
                request.wholesalePrice(), request.minStockThreshold(), request.isPerishable()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        inventoryService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/products/{id}/restore")
    public ResponseEntity<Product> restoreProduct(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.restoreProduct(id));
    }

    @GetMapping("/products/{id}/available-stock")
    public ResponseEntity<Integer> getAvailableStock(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getAvailableStock(id));
    }

    @GetMapping("/products/{id}/prices")
    public ResponseEntity<com.retail.store.service.ProductCatalogLookup.ProductPriceDto> getPrices(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getPrices(id));
    }

    // ================= BATCHES & STOCK-IN =================
    @PostMapping({"/batches", "/batches/stock-in"})
    public ResponseEntity<ProductBatch> stockIn(@AuthenticationPrincipal UserDetailsImpl staff,
                                                @RequestBody StockInRequest request) {
        Long staffId = staff != null ? staff.getId() : null;
        ProductBatch batch = inventoryService.stockIn(
                request.productId(), request.supplierId(), request.effectiveBatchCode(),
                request.effectiveQuantity(), request.expiryDate(), staffId
        );
        return new ResponseEntity<>(batch, HttpStatus.CREATED);
    }

    @GetMapping("/batches")
    public ResponseEntity<List<ProductBatch>> getAllBatches() {
        return ResponseEntity.ok(inventoryService.getAllBatches());
    }

    @GetMapping("/batches/product/{productId}")
    public ResponseEntity<List<ProductBatch>> getBatchesByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getBatchesByProduct(productId));
    }

    @GetMapping({"/batches/expiring", "/alerts/expiring"})
    public ResponseEntity<List<ProductBatch>> getExpiringBatches(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(inventoryService.getExpiringBatches(days));
    }

    // ================= RADAR ALERTS & TRANSACTIONS =================
    @GetMapping({"/alerts/low-stock", "/low-stock"})
    public ResponseEntity<List<Product>> getLowStockAlerts(@RequestParam(required = false) Integer threshold) {
        if (threshold != null) {
            return ResponseEntity.ok(inventoryService.getAllProducts(false).stream()
                    .filter(p -> inventoryService.getAvailableStock(p.getId()) <= threshold)
                    .toList());
        }
        return ResponseEntity.ok(inventoryService.getLowStockAlerts());
    }

    @PostMapping({"/adjustments", "/adjust"})
    public ResponseEntity<InventoryTransaction> adjustStock(@AuthenticationPrincipal UserDetailsImpl staff,
                                                            @RequestBody StockAdjustmentRequest request) {
        Long staffId = staff != null ? staff.getId() : null;
        Long targetBatchId = request.batchId();
        if (targetBatchId == null && request.productId() != null) {
            List<ProductBatch> batches = inventoryService.getBatchesByProduct(request.productId());
            if (!batches.isEmpty()) {
                targetBatchId = batches.get(0).getId();
            }
        }
        InventoryTransaction tx = inventoryService.adjustStock(
                targetBatchId, request.effectiveDelta(), request.reason(), staffId
        );
        return new ResponseEntity<>(tx, HttpStatus.CREATED);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<InventoryTransaction>> getRecentTransactions() {
        return ResponseEntity.ok(inventoryService.getRecentTransactions());
    }

    @PostMapping("/expiry-check")
    public ResponseEntity<String> triggerExpiryCheck() {
        inventoryService.markExpiredBatches();
        return ResponseEntity.ok("Expired batch scan completed successfully");
    }

    // ================= DTO RECORDS =================
    public record CreateCategoryRequest(String name, String description) {}

    public record CreateSupplierRequest(String name, String contactName, String email, String phone, String address, String profileImage) {
        public CreateSupplierRequest(String name, String contactName, String email, String phone, String address) {
            this(name, contactName, email, phone, address, null);
        }
    }

    public record CreateProductRequest(
            Integer categoryId, String sku, String name, String description, String imageUrl, String images,
            BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice,
            Integer minStockThreshold, Boolean isPerishable
    ) {
        public CreateProductRequest(Integer categoryId, String sku, String name, String description, String imageUrl,
                                    BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice,
                                    Integer minStockThreshold, Boolean isPerishable) {
            this(categoryId, sku, name, description, imageUrl, null, costPrice, retailPrice, wholesalePrice, minStockThreshold, isPerishable);
        }
    }

    public record UpdateProductRequest(
            Integer categoryId, String name, String description, String imageUrl, String images,
            BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice,
            Integer minStockThreshold, Boolean isPerishable
    ) {
        public UpdateProductRequest(Integer categoryId, String name, String description, String imageUrl,
                                    BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice,
                                    Integer minStockThreshold, Boolean isPerishable) {
            this(categoryId, name, description, imageUrl, null, costPrice, retailPrice, wholesalePrice, minStockThreshold, isPerishable);
        }
    }

    public record StockInRequest(
            Long productId, Integer supplierId, String batchCode, String batchNumber,
            Integer quantity, BigDecimal costPrice,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate
    ) {
        // Compatibility constructor for existing 5-argument callers
        public StockInRequest(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate) {
            this(productId, supplierId, batchCode, null, quantity, null, expiryDate);
        }

        public String effectiveBatchCode() {
            return (batchCode != null && !batchCode.isBlank()) ? batchCode : batchNumber;
        }

        public int effectiveQuantity() {
            return quantity != null ? quantity : 0;
        }
    }

    public record StockAdjustmentRequest(
            Long batchId, Long productId,
            Integer quantityDelta, Integer adjustmentQuantity,
            String reason, String adjustedBy
    ) {
        // Compatibility constructor for existing 3-argument callers
        public StockAdjustmentRequest(Long batchId, int quantityDelta, String reason) {
            this(batchId, null, quantityDelta, null, reason, null);
        }

        public int effectiveDelta() {
            return quantityDelta != null ? quantityDelta : (adjustmentQuantity != null ? adjustmentQuantity : 0);
        }
    }
}

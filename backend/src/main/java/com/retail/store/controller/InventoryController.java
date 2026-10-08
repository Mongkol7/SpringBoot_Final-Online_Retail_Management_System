package com.retail.store.controller;

import com.retail.store.entity.Category;
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

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CreateCategoryRequest request) {
        return new ResponseEntity<>(inventoryService.createCategory(request.name(), request.description()), HttpStatus.CREATED);
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> createSupplier(@RequestBody CreateSupplierRequest request) {
        return new ResponseEntity<>(inventoryService.createSupplier(
                request.name(), request.contactName(), request.email(), request.phone(), request.address()), HttpStatus.CREATED);
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody CreateProductRequest request) {
        Product product = inventoryService.createProduct(
                request.categoryId(), request.sku(), request.name(), request.description(),
                request.imageUrl(), request.costPrice(), request.retailPrice(),
                request.wholesalePrice(), request.minStockThreshold(), request.isPerishable()
        );
        return new ResponseEntity<>(product, HttpStatus.CREATED);
    }

    @PostMapping("/batches/stock-in")
    public ResponseEntity<ProductBatch> stockIn(@AuthenticationPrincipal UserDetailsImpl staff,
                                                @RequestBody StockInRequest request) {
        ProductBatch batch = inventoryService.stockIn(
                request.productId(), request.supplierId(), request.batchCode(),
                request.quantity(), request.expiryDate(), staff.getId()
        );
        return new ResponseEntity<>(batch, HttpStatus.CREATED);
    }

    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<Product>> getLowStockAlerts() {
        return ResponseEntity.ok(inventoryService.getLowStockAlerts());
    }

    public record CreateCategoryRequest(String name, String description) {}
    public record CreateSupplierRequest(String name, String contactName, String email, String phone, String address) {}
    public record CreateProductRequest(
            Integer categoryId, String sku, String name, String description, String imageUrl,
            BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice,
            Integer minStockThreshold, Boolean isPerishable
    ) {}
    public record StockInRequest(
            Long productId, Integer supplierId, String batchCode, int quantity,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate
    ) {}
}

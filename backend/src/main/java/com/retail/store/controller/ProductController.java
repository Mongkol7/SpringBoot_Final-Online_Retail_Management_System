package com.retail.store.controller;

import com.retail.store.entity.Category;
import com.retail.store.entity.Product;
import com.retail.store.repository.CategoryRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;

    public ProductController(ProductRepository productRepository,
                             CategoryRepository categoryRepository,
                             InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/products")
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Product> result;

        if (categoryId != null) {
            result = productRepository.findByCategory_IdAndIsDeletedFalse(categoryId, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            result = productRepository.findByNameContainingIgnoreCaseAndIsDeletedFalse(keyword.trim(), pageable);
        } else {
            result = productRepository.findByIsDeletedFalse(pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getProductById(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getPublicCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }
}

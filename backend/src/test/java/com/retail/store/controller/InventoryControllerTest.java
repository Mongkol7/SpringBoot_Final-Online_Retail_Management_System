package com.retail.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.store.entity.Category;
import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Product;
import com.retail.store.entity.ProductBatch;
import com.retail.store.entity.Supplier;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.service.InventoryService;
import com.retail.store.service.ProductCatalogLookup;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @MockBean
    private com.retail.store.security.jwt.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.retail.store.security.user.CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("POST /inventory/categories: Creates a new category")
    @WithMockUser(username = "stock@retailstore.com", roles = {"STOCK_CONTROLLER"})
    void testCreateCategory() throws Exception {
        Category category = new Category(1, "Dairy", "Milk, yogurt, and butter");
        when(inventoryService.createCategory("Dairy", "Milk, yogurt, and butter")).thenReturn(category);

        InventoryController.CreateCategoryRequest request = new InventoryController.CreateCategoryRequest("Dairy", "Milk, yogurt, and butter");

        mockMvc.perform(post("/inventory/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Dairy"));
    }

    @Test
    @DisplayName("GET /inventory/categories: Returns all categories")
    void testGetAllCategories() throws Exception {
        when(inventoryService.getAllCategories()).thenReturn(List.of(
                new Category(1, "Dairy", "Milk"),
                new Category(2, "Beverages", "Drinks")
        ));

        mockMvc.perform(get("/inventory/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Dairy"));
    }

    @Test
    @DisplayName("POST /inventory/products: Creates a new product with pricing hierarchy")
    @WithMockUser(username = "stock@retailstore.com", roles = {"STOCK_CONTROLLER"})
    void testCreateProduct() throws Exception {
        Category category = new Category(1, "Dairy", "Milk");
        Product product = new Product(
                10L, category, "MILK-001", "Whole Milk 1L", "Fresh milk",
                "milk.jpg", new BigDecimal("1.50"), new BigDecimal("3.00"), new BigDecimal("2.20"),
                10, true, false, LocalDateTime.now(), LocalDateTime.now()
        );

        when(inventoryService.createProduct(
                eq(1), eq("MILK-001"), eq("Whole Milk 1L"), eq("Fresh milk"),
                eq("milk.jpg"), eq(new BigDecimal("1.50")), eq(new BigDecimal("3.00")),
                eq(new BigDecimal("2.20")), eq(10), eq(true)
        )).thenReturn(product);

        InventoryController.CreateProductRequest request = new InventoryController.CreateProductRequest(
                1, "MILK-001", "Whole Milk 1L", "Fresh milk", "milk.jpg",
                new BigDecimal("1.50"), new BigDecimal("3.00"), new BigDecimal("2.20"),
                10, true
        );

        mockMvc.perform(post("/inventory/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.sku").value("MILK-001"))
                .andExpect(jsonPath("$.retailPrice").value(3.00));
    }

    @Test
    @DisplayName("POST /inventory/batches/stock-in: Ingests inbound batch")
    @WithMockUser(username = "stock@retailstore.com", roles = {"STOCK_CONTROLLER"})
    void testStockInBatch() throws Exception {
        Category category = new Category(1, "Dairy", "Milk");
        Product product = new Product(
                10L, category, "MILK-001", "Whole Milk", "", null,
                BigDecimal.ONE, BigDecimal.TEN, BigDecimal.valueOf(5), 10, false, false, null, null
        );
        Supplier supplier = new Supplier(1, "Dairy Farm Co", "Bob", "bob@dairy.com", "+123", "Farm Rd");

        ProductBatch batch = ProductBatch.builder()
                .id(100L)
                .batchCode("BATCH-MILK-99")
                .product(product)
                .supplier(supplier)
                .initialQuantity(60)
                .currentQuantity(60)
                .expiryDate(LocalDate.now().plusMonths(1))
                .isExpired(false)
                .build();

        when(inventoryService.stockIn(eq(10L), eq(1), eq("BATCH-MILK-99"), eq(60), any(), any()))
                .thenReturn(batch);

        InventoryController.StockInRequest request = new InventoryController.StockInRequest(
                10L, 1, "BATCH-MILK-99", 60, LocalDate.now().plusMonths(1)
        );

        mockMvc.perform(post("/inventory/batches/stock-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.batchCode").value("BATCH-MILK-99"))
                .andExpect(jsonPath("$.currentQuantity").value(60));
    }

    @Test
    @DisplayName("GET /inventory/alerts/low-stock: Returns low stock products")
    void testGetLowStockAlerts() throws Exception {
        Category category = new Category(1, "Dairy", "Milk");
        Product product = new Product(
                10L, category, "MILK-001", "Whole Milk", "", null,
                BigDecimal.ONE, BigDecimal.TEN, BigDecimal.valueOf(5), 10, false, false, null, null
        );

        when(inventoryService.getLowStockAlerts()).thenReturn(List.of(product));

        mockMvc.perform(get("/inventory/alerts/low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sku").value("MILK-001"));
    }

    @Test
    @DisplayName("POST /inventory/adjustments: Applies manual stock reconciliation")
    @WithMockUser(username = "stock@retailstore.com", roles = {"STOCK_CONTROLLER"})
    void testStockAdjustment() throws Exception {
        InventoryTransaction tx = InventoryTransaction.builder()
                .id(50L)
                .type(TransactionType.MANUAL_ADJUSTMENT)
                .quantityDelta(-3)
                .reason("Damaged goods write-off")
                .build();

        when(inventoryService.adjustStock(eq(100L), eq(-3), eq("Damaged goods write-off"), any()))
                .thenReturn(tx);

        InventoryController.StockAdjustmentRequest request = new InventoryController.StockAdjustmentRequest(
                100L, -3, "Damaged goods write-off"
        );

        mockMvc.perform(post("/inventory/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.quantityDelta").value(-3))
                .andExpect(jsonPath("$.reason").value("Damaged goods write-off"));
    }

    @Test
    @DisplayName("POST /inventory/products/{id}/restore: Restores soft-deleted product")
    @WithMockUser(username = "stock@retailstore.com", roles = {"STOCK_CONTROLLER"})
    void testRestoreProductEndpoint() throws Exception {
        Category category = new Category(1, "Dairy", "Milk");
        Product product = new Product(
                10L, category, "MILK-001", "Whole Milk", "", null,
                BigDecimal.ONE, BigDecimal.TEN, BigDecimal.valueOf(5), 10, false, false, null, null
        );

        when(inventoryService.restoreProduct(10L)).thenReturn(product);

        mockMvc.perform(post("/inventory/products/10/restore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.isDeleted").value(false));
    }

    @Test
    @DisplayName("GET /inventory/products/{id}/prices: Contract 2 Price lookup")
    void testGetPricesEndpoint() throws Exception {
        ProductCatalogLookup.ProductPriceDto priceDto = new ProductCatalogLookup.ProductPriceDto(
                10L, "MILK-001", "Whole Milk", new BigDecimal("1.50"), new BigDecimal("3.00"),
                new BigDecimal("2.20"), true, 45
        );

        when(inventoryService.getPrices(10L)).thenReturn(priceDto);

        mockMvc.perform(get("/inventory/products/10/prices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("MILK-001"))
                .andExpect(jsonPath("$.retailPrice").value(3.00))
                .andExpect(jsonPath("$.availableStock").value(45));
    }
}

package com.retail.store.service;

import com.retail.store.entity.*;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.BadRequestException;
import com.retail.store.exception.InsufficientStockException;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.repository.*;
import com.retail.store.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductBatchRepository batchRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderItemBatchFulfillmentRepository fulfillmentRepository;
    @Mock
    private InventoryTransactionRepository transactionRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Category testCategory;
    private Supplier testSupplier;
    private Product perishableProduct;
    private Product nonPerishableProduct;

    @BeforeEach
    void setUp() {
        testCategory = new Category(1, "Electronics", "Devices and gadgets");
        testSupplier = new Supplier(1, "Global Imports", "John Doe", "john@global.com", "+123456789", "123 Port St");

        perishableProduct = new Product(
                10L, testCategory, "PERISH-001", "Organic Milk", "Fresh dairy milk",
                "milk.jpg", new BigDecimal("2.00"), new BigDecimal("4.00"), new BigDecimal("3.00"),
                10, true, false, LocalDateTime.now(), LocalDateTime.now()
        );

        nonPerishableProduct = new Product(
                20L, testCategory, "TECH-001", "USB Cable", "Braided cable",
                "cable.jpg", new BigDecimal("5.00"), new BigDecimal("12.00"), new BigDecimal("9.00"),
                5, false, false, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("Product Creation: Valid prices and unique SKU succeeds")
    void testCreateProduct_Success() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(testCategory));
        when(productRepository.existsBySku("PERISH-001")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product created = inventoryService.createProduct(
                1, "PERISH-001", "Organic Milk", "Fresh milk",
                "milk.jpg", new BigDecimal("2.00"), new BigDecimal("4.00"),
                new BigDecimal("3.00"), 10, true
        );

        assertNotNull(created);
        assertEquals("PERISH-001", created.getSku());
        assertEquals("Organic Milk", created.getName());
        assertTrue(created.getIsPerishable());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Product Creation: Cost price higher than retail throws BadRequestException")
    void testCreateProduct_InvalidPricingHierarchy() {
        assertThrows(BadRequestException.class, () -> {
            inventoryService.createProduct(
                    1, "INVALID-001", "Bad Pricing", "Desc",
                    null, new BigDecimal("15.00"), new BigDecimal("10.00"),
                    new BigDecimal("12.00"), 10, false
            );
        });
    }

    @Test
    @DisplayName("Product Creation: Wholesale price higher than retail throws BadRequestException")
    void testCreateProduct_WholesaleExceedsRetail() {
        assertThrows(BadRequestException.class, () -> {
            inventoryService.createProduct(
                    1, "INVALID-002", "Bad Pricing", "Desc",
                    null, new BigDecimal("5.00"), new BigDecimal("10.00"),
                    new BigDecimal("12.00"), 10, false
            );
        });
    }

    @Test
    @DisplayName("Stock-In: Perishable product requires valid future expiry date")
    void testStockIn_PerishableRequiresFutureExpiry() {
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(perishableProduct));
        when(supplierRepository.findById(1)).thenReturn(Optional.of(testSupplier));
        when(batchRepository.findByBatchCode("BATCH-001")).thenReturn(Optional.empty());

        // Past expiry date should throw exception
        assertThrows(BadRequestException.class, () -> {
            inventoryService.stockIn(10L, 1, "BATCH-001", 50, LocalDate.now().minusDays(1), 1L);
        });

        // Null expiry date should throw exception
        assertThrows(BadRequestException.class, () -> {
            inventoryService.stockIn(10L, 1, "BATCH-001", 50, null, 1L);
        });
    }

    @Test
    @DisplayName("Stock-In: Successful stock-in creates batch and STOCK_IN transaction")
    void testStockIn_Success() {
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(perishableProduct));
        when(supplierRepository.findById(1)).thenReturn(Optional.of(testSupplier));
        when(batchRepository.findByBatchCode("BATCH-OK")).thenReturn(Optional.empty());
        when(batchRepository.save(any(ProductBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        LocalDate futureExpiry = LocalDate.now().plusMonths(3);
        ProductBatch batch = inventoryService.stockIn(10L, 1, "BATCH-OK", 100, futureExpiry, 1L);

        assertNotNull(batch);
        assertEquals("BATCH-OK", batch.getBatchCode());
        assertEquals(100, batch.getInitialQuantity());
        assertEquals(100, batch.getCurrentQuantity());
        assertFalse(batch.getIsExpired());

        ArgumentCaptor<InventoryTransaction> txCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository).save(txCaptor.capture());
        assertEquals(TransactionType.STOCK_IN, txCaptor.getValue().getType());
        assertEquals(100, txCaptor.getValue().getQuantityDelta());
    }

    @Test
    @DisplayName("FIFO Engine: Non-perishable items allocated by arrival date")
    void testAllocateAndDeductBatches_FIFO() {
        when(productRepository.findById(20L)).thenReturn(Optional.of(nonPerishableProduct));
        when(batchRepository.sumAvailableStock(20L, LocalDate.now())).thenReturn(100);

        ProductBatch batch1 = ProductBatch.builder()
                .id(1L).batchCode("CABLE-B1").product(nonPerishableProduct).supplier(testSupplier)
                .initialQuantity(30).currentQuantity(30).receivedAt(LocalDateTime.now().minusDays(10)).build();

        ProductBatch batch2 = ProductBatch.builder()
                .id(2L).batchCode("CABLE-B2").product(nonPerishableProduct).supplier(testSupplier)
                .initialQuantity(50).currentQuantity(50).receivedAt(LocalDateTime.now().minusDays(5)).build();

        when(batchRepository.findActiveBatchesFIFO(20L)).thenReturn(List.of(batch1, batch2));

        // Request 40 units: 30 from batch1, 10 from batch2
        List<BatchAllocationService.FulfillmentResultDto> results = inventoryService.allocateAndDeductBatches(
                null, 20L, 40, 1L, "POS_SALE"
        );

        assertEquals(2, results.size());
        assertEquals(30, results.get(0).quantityDeducted());
        assertEquals(0, batch1.getCurrentQuantity());
        assertEquals(10, results.get(1).quantityDeducted());
        assertEquals(40, batch2.getCurrentQuantity());

        verify(transactionRepository, times(2)).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("FEFO Engine: Perishable items allocated by nearest expiry date")
    void testAllocateAndDeductBatches_FEFO() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(perishableProduct));
        when(batchRepository.sumAvailableStock(10L, LocalDate.now())).thenReturn(50);

        ProductBatch batchExpiringSoon = ProductBatch.builder()
                .id(11L).batchCode("MILK-NEAR").product(perishableProduct).supplier(testSupplier)
                .initialQuantity(15).currentQuantity(15).expiryDate(LocalDate.now().plusDays(2)).build();

        ProductBatch batchExpiringLater = ProductBatch.builder()
                .id(12L).batchCode("MILK-LATER").product(perishableProduct).supplier(testSupplier)
                .initialQuantity(25).currentQuantity(25).expiryDate(LocalDate.now().plusDays(10)).build();

        when(batchRepository.findActiveBatchesFEFO(10L, LocalDate.now()))
                .thenReturn(List.of(batchExpiringSoon, batchExpiringLater));

        // Request 20 units: 15 from batchExpiringSoon, 5 from batchExpiringLater
        List<BatchAllocationService.FulfillmentResultDto> results = inventoryService.allocateAndDeductBatches(
                null, 10L, 20, 1L, "ONLINE_SALE"
        );

        assertEquals(2, results.size());
        assertEquals(15, results.get(0).quantityDeducted());
        assertEquals(0, batchExpiringSoon.getCurrentQuantity());
        assertEquals(5, results.get(1).quantityDeducted());
        assertEquals(20, batchExpiringLater.getCurrentQuantity());
    }

    @Test
    @DisplayName("Allocation Engine: Insufficient stock throws InsufficientStockException")
    void testAllocateAndDeductBatches_InsufficientStock() {
        when(productRepository.findById(20L)).thenReturn(Optional.of(nonPerishableProduct));
        when(batchRepository.sumAvailableStock(20L, LocalDate.now())).thenReturn(10);

        assertThrows(InsufficientStockException.class, () -> {
            inventoryService.allocateAndDeductBatches(null, 20L, 50, 1L, "POS_SALE");
        });
    }

    @Test
    @DisplayName("Stock Restoration: Restores quantity and logs MANUAL_ADJUSTMENT")
    void testRestoreStockForOrderItem() {
        ProductBatch batch = ProductBatch.builder()
                .id(100L).batchCode("RESTORE-B").product(nonPerishableProduct).supplier(testSupplier)
                .initialQuantity(50).currentQuantity(10).build();

        OrderItemBatchFulfillment fulfillment = new OrderItemBatchFulfillment(1L, null, batch, 15);
        when(fulfillmentRepository.findByOrderItem_Id(500L)).thenReturn(List.of(fulfillment));

        inventoryService.restoreStockForOrderItem(500L, 1L);

        assertEquals(25, batch.getCurrentQuantity());
        verify(batchRepository).save(batch);

        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository).save(captor.capture());
        assertEquals(TransactionType.MANUAL_ADJUSTMENT, captor.getValue().getType());
        assertEquals(15, captor.getValue().getQuantityDelta());
    }

    @Test
    @DisplayName("Low Stock Radar: Identifies products with active stock <= minStockThreshold")
    void testGetLowStockAlerts() {
        when(productRepository.findByIsDeletedFalse()).thenReturn(List.of(perishableProduct, nonPerishableProduct));
        // perishable: minThreshold = 10, stock = 4 -> ALERT
        when(batchRepository.sumAvailableStock(10L, LocalDate.now())).thenReturn(4);
        // nonPerishable: minThreshold = 5, stock = 20 -> OK
        when(batchRepository.sumAvailableStock(20L, LocalDate.now())).thenReturn(20);

        List<Product> lowStock = inventoryService.getLowStockAlerts();

        assertEquals(1, lowStock.size());
        assertEquals("PERISH-001", lowStock.get(0).getSku());
    }

    @Test
    @DisplayName("Scheduled Expiry Watcher: Flags past-date batches as expired and zeroes quantity")
    void testMarkExpiredBatches() {
        ProductBatch expiredBatch = ProductBatch.builder()
                .id(99L).batchCode("EXPIRED-1").product(perishableProduct).supplier(testSupplier)
                .initialQuantity(30).currentQuantity(18).expiryDate(LocalDate.now().minusDays(1))
                .isExpired(false).build();

        when(batchRepository.findByIsExpiredFalseAndExpiryDateLessThanEqual(LocalDate.now()))
                .thenReturn(List.of(expiredBatch));

        inventoryService.markExpiredBatches();

        assertTrue(expiredBatch.getIsExpired());
        assertEquals(0, expiredBatch.getCurrentQuantity());
        verify(batchRepository).save(expiredBatch);

        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository).save(captor.capture());
        assertEquals(TransactionType.EXPIRED_WRITE_OFF, captor.getValue().getType());
        assertEquals(-18, captor.getValue().getQuantityDelta());
    }

    @Test
    @DisplayName("Category Management: Update and Delete Category")
    void testCategoryUpdateAndDelete() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(testCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Category updated = inventoryService.updateCategory(1, "Modern Electronics", "Updated description");
        assertEquals("Modern Electronics", updated.getName());
        assertEquals("Updated description", updated.getDescription());

        inventoryService.deleteCategory(1);
        verify(categoryRepository).delete(testCategory);
    }

    @Test
    @DisplayName("Supplier Management: Update and Delete Supplier")
    void testSupplierUpdateAndDelete() {
        when(supplierRepository.findById(1)).thenReturn(Optional.of(testSupplier));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        Supplier updated = inventoryService.updateSupplier(1, "Global Logistics", "Jane Doe", "jane@logistics.com", "+987654321", "456 Oak St");
        assertEquals("Global Logistics", updated.getName());
        assertEquals("Jane Doe", updated.getContactName());

        inventoryService.deleteSupplier(1);
        verify(supplierRepository).delete(testSupplier);
    }

    @Test
    @DisplayName("Product Lifecycle: Soft-delete restoration restores isDeleted = false")
    void testRestoreProduct() {
        perishableProduct.setIsDeleted(true);
        when(productRepository.findById(10L)).thenReturn(Optional.of(perishableProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Product restored = inventoryService.restoreProduct(10L);
        assertFalse(restored.getIsDeleted());
        verify(productRepository).save(perishableProduct);
    }

    @Test
    @DisplayName("Contract 2: ProductCatalogLookup returns prices and checks availability")
    void testProductCatalogLookup() {
        when(productRepository.findByIdAndIsDeletedFalse(20L)).thenReturn(Optional.of(nonPerishableProduct));
        when(batchRepository.sumAvailableStock(20L, LocalDate.now())).thenReturn(25);

        ProductCatalogLookup.ProductPriceDto prices = inventoryService.getPrices(20L);
        assertNotNull(prices);
        assertEquals("TECH-001", prices.sku());
        assertEquals(new BigDecimal("5.00"), prices.costPrice());
        assertEquals(new BigDecimal("12.00"), prices.retailPrice());
        assertEquals(new BigDecimal("9.00"), prices.wholesalePrice());
        assertEquals(25, prices.availableStock());

        boolean isAvailable = inventoryService.isProductAvailable(20L);
        assertTrue(isAvailable);
    }
}

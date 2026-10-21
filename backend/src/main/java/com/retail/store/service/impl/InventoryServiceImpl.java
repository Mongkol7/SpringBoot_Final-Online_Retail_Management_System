package com.retail.store.service.impl;

import com.retail.store.entity.*;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.BadRequestException;
import com.retail.store.exception.InsufficientStockException;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.repository.CategoryRepository;
import com.retail.store.repository.InventoryTransactionRepository;
import com.retail.store.repository.OrderItemBatchFulfillmentRepository;
import com.retail.store.repository.OrderItemRepository;
import com.retail.store.repository.ProductBatchRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.SupplierRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 3 (STOCK_CONTROLLER Role)
 * =========================================================================
 * Responsibilities:
 * 1. Product Catalog & Supplier Management (create category, supplier, product).
 * 2. Inbound Stock-In (intake new product batches with expiry date and batch code).
 * 3. FIFO / FEFO Batch Allocation Algorithm:
 *    - For perishable goods (product.isPerishable = true):
 *      Apply FEFO (First-Expired, First-Out) sorted by expiryDate ASC.
 *    - For non-perishable goods (product.isPerishable = false):
 *      Apply FIFO (First-In, First-Out) sorted by receivedAt ASC.
 *    - Deduct quantity from batches and record OrderItemBatchFulfillment.
 *    - Append immutable InventoryTransaction ledger record for each deduction.
 * 4. Stock Restoration upon order cancellation.
 * 5. Low-Stock Alert Radar (detect products where total available <= minStockThreshold).
 * 6. Scheduled Expiry Watcher (flag batches where expiryDate <= now as isExpired = true).
 * =========================================================================
 */
@Service
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemBatchFulfillmentRepository fulfillmentRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public InventoryServiceImpl(ProductRepository productRepository,
                                ProductBatchRepository batchRepository,
                                CategoryRepository categoryRepository,
                                SupplierRepository supplierRepository,
                                OrderItemRepository orderItemRepository,
                                OrderItemBatchFulfillmentRepository fulfillmentRepository,
                                InventoryTransactionRepository transactionRepository,
                                UserRepository userRepository) {
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.orderItemRepository = orderItemRepository;
        this.fulfillmentRepository = fulfillmentRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Category createCategory(String name, String description) {
        return categoryRepository.save(new Category(null, name, description));
    }

    @Override
    @Transactional
    public Supplier createSupplier(String name, String contactName, String email, String phone, String address) {
        return supplierRepository.save(new Supplier(null, name, contactName, email, phone, address));
    }

    @Override
    @Transactional
    public Product createProduct(Integer categoryId, String sku, String name, String description,
                                 String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                                 BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable) {
        return null;
    }

    @Override
    @Transactional
    public ProductBatch stockIn(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate, Long staffUserId) {
        return null;
    }

    @Override
    @Transactional
    public List<FulfillmentResultDto> allocateAndDeductBatches(Long orderItemId, Long productId, int requestedQuantity, Long actorUserId, String transactionType) {
        if (requestedQuantity <= 0) {
            throw new BadRequestException("Requested quantity must be greater than zero.");
        }

        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Active product not found with ID: " + productId));

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem not found with ID: " + orderItemId));

        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User staff not found with ID: " + actorUserId));

        // FEFO for perishable items, FIFO for non-perishable items
        List<ProductBatch> candidateBatches = Boolean.TRUE.equals(product.getIsPerishable())
                ? batchRepository.findActiveBatchesFEFO(productId, LocalDate.now())
                : batchRepository.findActiveBatchesFIFO(productId);

        int remainingToFulfill = requestedQuantity;
        List<FulfillmentResultDto> results = new ArrayList<>();

        TransactionType txType = TransactionType.POS_SALE;
        if (transactionType != null) {
            try {
                txType = TransactionType.valueOf(transactionType);
            } catch (IllegalArgumentException ignored) {}
        }

        for (ProductBatch batch : candidateBatches) {
            if (remainingToFulfill <= 0) {
                break;
            }

            int availableInBatch = batch.getCurrentQuantity();
            if (availableInBatch <= 0) continue;

            int deductFromThisBatch = Math.min(availableInBatch, remainingToFulfill);
            batch.setCurrentQuantity(availableInBatch - deductFromThisBatch);
            batchRepository.save(batch);

            OrderItemBatchFulfillment fulfillment = OrderItemBatchFulfillment.builder()
                    .orderItem(orderItem)
                    .batch(batch)
                    .quantityDeducted(deductFromThisBatch)
                    .build();
            fulfillmentRepository.save(fulfillment);

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .batch(batch)
                    .user(actor)
                    .type(txType)
                    .quantityDelta(-deductFromThisBatch)
                    .reason("Batch deduction for OrderItem #" + orderItemId)
                    .build();
            transactionRepository.save(transaction);

            results.add(new FulfillmentResultDto(orderItemId, batch.getId(), deductFromThisBatch));
            remainingToFulfill -= deductFromThisBatch;
        }

        if (remainingToFulfill > 0) {
            throw new InsufficientStockException(
                    "Insufficient stock for product '" + product.getName() + "'. Short by " + remainingToFulfill + " units."
            );
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public int getAvailableStock(Long productId) {
        return batchRepository.sumAvailableStock(productId, LocalDate.now());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<CurrentBatchInfoDto> getCurrentBatchInfo(Long productId) {
        if (productId == null) {
            return java.util.Optional.empty();
        }
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return java.util.Optional.empty();
        }

        List<ProductBatch> batches;
        if (Boolean.TRUE.equals(product.getIsPerishable())) {
            batches = batchRepository.findActiveBatchesFEFO(productId, LocalDate.now());
        } else {
            batches = batchRepository.findActiveBatchesFIFO(productId);
        }

        ProductBatch batch;
        if (!batches.isEmpty()) {
            batch = batches.get(0);
        } else {
            batch = batchRepository.findFirstByProduct_IdOrderByReceivedAtDesc(productId).orElse(null);
        }

        if (batch == null) {
            return java.util.Optional.empty();
        }

        LocalDate expiryDate = batch.getExpiryDate();
        if (expiryDate == null) {
            expiryDate = batch.getReceivedAt() != null
                    ? batch.getReceivedAt().toLocalDate().plusYears(1)
                    : LocalDate.now().plusYears(1);
        }

        return java.util.Optional.of(new CurrentBatchInfoDto(
                batch.getId(),
                batch.getBatchCode(),
                expiryDate,
                batch.getCurrentQuantity()
        ));
    }

    @Override
    @Transactional
    public void restoreStockForOrderItem(Long orderItemId, Long actorUserId) {
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getLowStockAlerts() {
        return productRepository.findByIsDeletedFalseOrderByNameAsc().stream()
                .filter(p -> {
                    int available = getAvailableStock(p.getId());
                    int threshold = p.getMinStockThreshold() != null ? p.getMinStockThreshold() : 10;
                    return available <= threshold;
                })
                .toList();
    }

    @Override
    @Transactional
    public void markExpiredBatches() {
        List<ProductBatch> expired = batchRepository.findByIsExpiredFalseAndExpiryDateLessThanEqual(LocalDate.now());
        for (ProductBatch b : expired) {
            b.setIsExpired(true);
            batchRepository.save(b);
        }
    }
}

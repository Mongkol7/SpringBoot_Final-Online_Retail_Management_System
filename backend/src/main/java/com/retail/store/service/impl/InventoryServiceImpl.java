package com.retail.store.service.impl;

import com.retail.store.entity.Category;
import com.retail.store.entity.Product;
import com.retail.store.entity.ProductBatch;
import com.retail.store.entity.Supplier;
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

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.OrderItemBatchFulfillment;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.InsufficientStockException;
import com.retail.store.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
        // TODO [Person 3]: Create and save a new Category
        return categoryRepository.save(new Category(null, name, description));
    }

    @Override
    @Transactional
    public Supplier createSupplier(String name, String contactName, String email, String phone, String address) {
        // TODO [Person 3]: Create and save a new Supplier
        return supplierRepository.save(new Supplier(null, name, contactName, email, phone, address));
    }

    @Override
    @Transactional
    public Product createProduct(Integer categoryId, String sku, String name, String description,
                                 String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                                 BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable) {
        // TODO [Person 3]: Validate costPrice <= retailPrice and costPrice <= wholesalePrice
        // TODO [Person 3]: Fetch Category by categoryId and persist new Product
        return null;
    }

    @Override
    @Transactional
    public ProductBatch stockIn(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate, Long staffUserId) {
        // TODO [Person 3]: 1. Validate perishable product requires a valid future expiry date
        // TODO [Person 3]: 2. Create ProductBatch with initialQuantity = currentQuantity = quantity
        // TODO [Person 3]: 3. Create immutable InventoryTransaction ledger entry with type = STOCK_IN
        return null;
    }

    @Override
    @Transactional
    public List<FulfillmentResultDto> allocateAndDeductBatches(Long orderItemId, Long productId, int requestedQuantity, Long actorUserId, String transactionType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        OrderItem orderItem = orderItemId != null
                ? orderItemRepository.findById(orderItemId).orElse(null)
                : null;

        User actor = actorUserId != null
                ? userRepository.findById(actorUserId).orElse(null)
                : null;
        if (actor == null) {
            actor = userRepository.findAll().stream().findFirst().orElse(null);
        }

        // 1. FEFO for perishable goods (sorted by expiryDate ASC), FIFO for non-perishable (sorted by receivedAt ASC)
        List<ProductBatch> batches = Boolean.TRUE.equals(product.getIsPerishable())
                ? batchRepository.findActiveBatchesFEFO(productId, LocalDate.now())
                : batchRepository.findActiveBatchesFIFO(productId);

        int remainingToDeduct = requestedQuantity;
        List<FulfillmentResultDto> results = new ArrayList<>();

        for (ProductBatch batch : batches) {
            if (remainingToDeduct <= 0) break;
            int availableInBatch = batch.getCurrentQuantity();
            if (availableInBatch <= 0) continue;

            int deductQty = Math.min(remainingToDeduct, availableInBatch);
            batch.setCurrentQuantity(availableInBatch - deductQty);
            batchRepository.save(batch);

            // Persist OrderItemBatchFulfillment
            if (orderItem != null) {
                OrderItemBatchFulfillment fulfillment = OrderItemBatchFulfillment.builder()
                        .orderItem(orderItem)
                        .batch(batch)
                        .quantityDeducted(deductQty)
                        .build();
                fulfillmentRepository.save(fulfillment);
            }

            // Record immutable InventoryTransaction ledger entry with negative delta
            TransactionType type = TransactionType.ONLINE_SALE;
            try {
                if (transactionType != null && !transactionType.isBlank()) {
                    type = TransactionType.valueOf(transactionType);
                }
            } catch (Exception ignored) {}

            String orderRef = (orderItem != null && orderItem.getOrder() != null)
                    ? orderItem.getOrder().getOrderNumber()
                    : "BATCH-ALLOCATION";

            InventoryTransaction tx = new InventoryTransaction(
                    null,
                    batch,
                    actor,
                    type,
                    -deductQty,
                    "Order fulfillment deduction: " + orderRef,
                    LocalDateTime.now()
            );
            transactionRepository.save(tx);

            results.add(new FulfillmentResultDto(orderItemId, batch.getId(), deductQty));
            remainingToDeduct -= deductQty;
        }

        if (remainingToDeduct > 0) {
            throw new InsufficientStockException("Insufficient stock in inventory batches for product: "
                    + product.getName() + " (requested: " + requestedQuantity + ", missing: " + remainingToDeduct + ")");
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public int getAvailableStock(Long productId) {
        return batchRepository.sumAvailableStock(productId, LocalDate.now());
    }

    @Override
    @Transactional
    public void restoreStockForOrderItem(Long orderItemId, Long actorUserId) {
        List<OrderItemBatchFulfillment> fulfillments = fulfillmentRepository.findByOrderItem_Id(orderItemId);
        User actor = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        if (actor == null) {
            actor = userRepository.findAll().stream().findFirst().orElse(null);
        }

        for (OrderItemBatchFulfillment fulfillment : fulfillments) {
            ProductBatch batch = fulfillment.getBatch();
            int restoreQty = fulfillment.getQuantityDeducted();
            batch.setCurrentQuantity(batch.getCurrentQuantity() + restoreQty);
            batchRepository.save(batch);

            InventoryTransaction tx = new InventoryTransaction(
                    null,
                    batch,
                    actor,
                    TransactionType.MANUAL_ADJUSTMENT,
                    restoreQty,
                    "Restored stock from cancelled order item #" + orderItemId,
                    LocalDateTime.now()
            );
            transactionRepository.save(tx);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getLowStockAlerts() {
        // TODO [Person 3]: Find all products where getAvailableStock(id) <= product.getMinStockThreshold()
        return Collections.emptyList();
    }

    @Override
    @Transactional
    public void markExpiredBatches() {
        // TODO [Person 3]: Find batches where expiryDate <= today and isExpired = false, update to isExpired = true
    }
}

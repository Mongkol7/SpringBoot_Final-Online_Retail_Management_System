package com.retail.store.service.impl;

import com.retail.store.entity.Category;
import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.OrderItemBatchFulfillment;
import com.retail.store.entity.Product;
import com.retail.store.entity.ProductBatch;
import com.retail.store.entity.Supplier;
import com.retail.store.entity.User;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 3 (STOCK_CONTROLLER Role)
 * =========================================================================
 * Responsibilities:
 * 1. Product Catalog & Supplier Management (create/update/delete category, supplier, product).
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
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Category name cannot be empty");
        }
        String trimmedName = name.trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new BadRequestException("Category '" + trimmedName + "' already exists");
        }
        return categoryRepository.save(new Category(null, trimmedName, description));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findByIsDeletedFalseOrderByNameAsc();
    }

    @Override
    @Transactional
    public Category updateCategory(Integer categoryId, String name, String description) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
        if (name != null && !name.trim().isEmpty()) {
            String trimmedName = name.trim();
            if (!trimmedName.equalsIgnoreCase(category.getName()) && categoryRepository.existsByNameIgnoreCase(trimmedName)) {
                throw new BadRequestException("Category '" + trimmedName + "' already exists");
            }
            category.setName(trimmedName);
        }
        if (description != null) {
            category.setDescription(description.trim());
        }
        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void deleteCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
        category.setIsDeleted(true);
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    public Supplier createSupplier(String name, String contactName, String email, String phone, String address, String profileImage) {
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Supplier name cannot be empty");
        }
        return supplierRepository.save(new Supplier(null, name.trim(), contactName, email, phone, address, profileImage, false));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findByIsDeletedFalseOrderByNameAsc();
    }

    @Override
    @Transactional
    public Supplier updateSupplier(Integer supplierId, String name, String contactName, String email, String phone, String address, String profileImage) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));
        if (name != null && !name.trim().isEmpty()) {
            supplier.setName(name.trim());
        }
        if (contactName != null) {
            supplier.setContactName(contactName.trim());
        }
        if (email != null) {
            supplier.setEmail(email.trim());
        }
        if (phone != null) {
            supplier.setPhone(phone.trim());
        }
        if (address != null) {
            supplier.setAddress(address.trim());
        }
        if (profileImage != null) {
            supplier.setProfileImage(profileImage.trim());
        }
        return supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public void deleteSupplier(Integer supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));
        supplier.setIsDeleted(true);
        supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public Product createProduct(Integer categoryId, String sku, String name, String description,
                                 String imageUrl, String images, BigDecimal costPrice, BigDecimal retailPrice,
                                 BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable) {
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Product name cannot be empty");
        }
        String trimmedName = name.trim();
        validatePricingHierarchy(costPrice, retailPrice, wholesalePrice);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (productRepository.existsByCategory_IdAndNameIgnoreCaseAndIsDeletedFalse(categoryId, trimmedName)) {
            throw new BadRequestException("A product named '" + trimmedName + "' already exists in this category");
        }

        String trimmedSku = (sku == null || sku.trim().isEmpty())
                ? generateProductSku(trimmedName, categoryId)
                : sku.trim().toUpperCase();
        if (productRepository.existsBySku(trimmedSku)) {
            throw new BadRequestException("Product with SKU '" + trimmedSku + "' already exists");
        }

        String effectiveImageUrl = imageUrl;
        if ((effectiveImageUrl == null || effectiveImageUrl.isBlank()) && images != null && !images.isBlank()) {
            effectiveImageUrl = extractFirstImage(images);
        }

        Product product = new Product(
                null,
                category,
                trimmedSku,
                trimmedName,
                description,
                effectiveImageUrl,
                images,
                costPrice,
                retailPrice,
                wholesalePrice,
                minThreshold != null ? minThreshold : 10,
                isPerishable != null ? isPerishable : false,
                false,
                null,
                null
        );

        return productRepository.save(product);
    }

    private String generateProductSku(String name, Integer categoryId) {
        String slug = name.toUpperCase()
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (slug.isEmpty()) slug = "PRODUCT";
        slug = slug.substring(0, Math.min(slug.length(), 24));

        String sku;
        do {
            sku = "SKU-" + categoryId + "-" + slug + "-" +
                    UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (productRepository.existsBySku(sku));
        return sku;
    }

    @Override
    @Transactional
    public Product updateProduct(Long productId, Integer categoryId, String name, String description,
                                 String imageUrl, String images, BigDecimal costPrice, BigDecimal retailPrice,
                                 BigDecimal wholesalePrice, Integer minThreshold, Boolean isPerishable) {
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (name != null && !name.trim().isEmpty()) {
            product.setName(name.trim());
        }
        if (description != null) {
            product.setDescription(description);
        }
        if (imageUrl != null) {
            product.setImageUrl(imageUrl);
        }
        if (images != null) {
            product.setImages(images);
            if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
                product.setImageUrl(extractFirstImage(images));
            }
        }
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
            product.setCategory(category);
        }

        BigDecimal finalCost = costPrice != null ? costPrice : product.getCostPrice();
        BigDecimal finalRetail = retailPrice != null ? retailPrice : product.getRetailPrice();
        BigDecimal finalWholesale = wholesalePrice != null ? wholesalePrice : product.getWholesalePrice();
        validatePricingHierarchy(finalCost, finalRetail, finalWholesale);

        product.setCostPrice(finalCost);
        product.setRetailPrice(finalRetail);
        product.setWholesalePrice(finalWholesale);

        if (minThreshold != null) {
            product.setMinStockThreshold(minThreshold);
        }
        if (isPerishable != null) {
            product.setIsPerishable(isPerishable);
        }

        return productRepository.save(product);
    }

    private String extractFirstImage(String images) {
        if (images == null || images.isBlank()) return null;
        try {
            String trimmed = images.trim();
            if (trimmed.startsWith("[")) {
                int firstQuote = trimmed.indexOf("\"");
                if (firstQuote != -1) {
                    int nextQuote = trimmed.indexOf("\"", firstQuote + 1);
                    if (nextQuote != -1) {
                        return trimmed.substring(firstQuote + 1, nextQuote);
                    }
                }
            } else if (trimmed.contains(",")) {
                return trimmed.split(",")[0].trim();
            }
            return trimmed;
        } catch (Exception e) {
            return images;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductById(Long productId) {
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        product.setStockQuantity(getAvailableStock(productId));
        return product;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllActiveProducts() {
        List<Product> list = productRepository.findByIsDeletedFalse();
        for (Product p : list) {
            p.setStockQuantity(getAvailableStock(p.getId()));
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts(boolean includeDeleted) {
        List<Product> list = includeDeleted
                ? productRepository.findAllByOrderByNameAsc()
                : productRepository.findByIsDeletedFalseOrderByNameAsc();
        for (Product p : list) {
            p.setStockQuantity(getAvailableStock(p.getId()));
        }
        return list;
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public Product restoreProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        product.setIsDeleted(false);
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductBatch stockIn(Long productId, Integer supplierId, String batchCode, int quantity, LocalDate expiryDate, Long staffUserId) {
        if (quantity <= 0) {
            throw new BadRequestException("Stock-in quantity must be greater than zero");
        }
        if (batchCode == null || batchCode.trim().isEmpty()) {
            throw new BadRequestException("Batch code cannot be empty");
        }
        String cleanBatchCode = batchCode.trim().toUpperCase();
        if (batchRepository.findByBatchCode(cleanBatchCode).isPresent()) {
            throw new BadRequestException("Batch code '" + cleanBatchCode + "' already exists");
        }

        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));

        if (expiryDate != null && !expiryDate.isAfter(LocalDate.now())) {
            throw new BadRequestException("Expiry date must be in the future (received: " + expiryDate + ")");
        }

        if (Boolean.TRUE.equals(product.getIsPerishable())) {
            if (expiryDate == null) {
                throw new BadRequestException("Perishable product requires an expiry date");
            }
        }

        ProductBatch batch = ProductBatch.builder()
                .batchCode(cleanBatchCode)
                .product(product)
                .supplier(supplier)
                .initialQuantity(quantity)
                .currentQuantity(quantity)
                .expiryDate(expiryDate)
                .isExpired(false)
                .build();
        ProductBatch savedBatch = batchRepository.save(batch);

        User staffUser = (staffUserId != null) ? userRepository.findById(staffUserId).orElse(null) : null;
        InventoryTransaction transaction = InventoryTransaction.builder()
                .batch(savedBatch)
                .user(staffUser)
                .type(TransactionType.STOCK_IN)
                .quantityDelta(quantity)
                .reason("Stock-In ingestion batch " + savedBatch.getBatchCode())
                .build();
        transactionRepository.save(transaction);

        return savedBatch;
    }

    @Override
    @Transactional
    public List<FulfillmentResultDto> allocateAndDeductBatches(Long orderItemId, Long productId, int requestedQuantity, Long actorUserId, String transactionType) {
        return allocateAndDeductBatches(orderItemId, productId, requestedQuantity, actorUserId, transactionType, false);
    }

    @Override
    @Transactional
    public List<FulfillmentResultDto> allocateAndDeductBatches(Long orderItemId, Long productId, int requestedQuantity, Long actorUserId, String transactionType, boolean preferFreshBatch) {
        if (requestedQuantity <= 0) {
            throw new BadRequestException("Requested quantity must be greater than zero");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        int available = getAvailableStock(productId);
        if (available < requestedQuantity) {
            throw new InsufficientStockException("Insufficient stock for product '" + product.getName() + "'. Available: " + available + ", Requested: " + requestedQuantity);
        }

        List<ProductBatch> candidateBatches;
        if (Boolean.TRUE.equals(product.getIsPerishable())) {
            // FEFO: First-Expired First-Out
            candidateBatches = batchRepository.findActiveBatchesFEFO(productId, LocalDate.now());
        } else {
            // FIFO: First-In First-Out
            candidateBatches = batchRepository.findActiveBatchesFIFO(productId);
        }

        if (preferFreshBatch && candidateBatches != null && !candidateBatches.isEmpty()) {
            LocalDate freshCutoff = LocalDate.now().plusDays(30);
            candidateBatches = new ArrayList<>(candidateBatches);
            candidateBatches.sort((b1, b2) -> {
                boolean b1Fresh = b1.getExpiryDate() == null || b1.getExpiryDate().isAfter(freshCutoff);
                boolean b2Fresh = b2.getExpiryDate() == null || b2.getExpiryDate().isAfter(freshCutoff);
                if (b1Fresh && !b2Fresh) return -1;
                if (!b1Fresh && b2Fresh) return 1;
                return 0;
            });
        }

        OrderItem orderItem = (orderItemId != null) ? orderItemRepository.findById(orderItemId).orElse(null) : null;
        User actorUser = (actorUserId != null) ? userRepository.findById(actorUserId).orElse(null) : null;

        TransactionType resolvedType = TransactionType.POS_SALE;
        if (transactionType != null) {
            try {
                resolvedType = TransactionType.valueOf(transactionType);
            } catch (IllegalArgumentException ignored) {
                resolvedType = TransactionType.POS_SALE;
            }
        }

        int remainingQty = requestedQuantity;
        List<FulfillmentResultDto> fulfillments = new ArrayList<>();

        for (ProductBatch batch : candidateBatches) {
            if (remainingQty <= 0) break;
            int batchStock = batch.getCurrentQuantity();
            if (batchStock <= 0) continue;

            int toDeduct = Math.min(batchStock, remainingQty);
            batch.setCurrentQuantity(batchStock - toDeduct);
            batchRepository.save(batch);

            if (orderItem != null) {
                OrderItemBatchFulfillment fulfillment = OrderItemBatchFulfillment.builder()
                        .orderItem(orderItem)
                        .batch(batch)
                        .quantityDeducted(toDeduct)
                        .build();
                fulfillmentRepository.save(fulfillment);
            }

            InventoryTransaction tx = InventoryTransaction.builder()
                    .batch(batch)
                    .user(actorUser)
                    .type(resolvedType)
                    .quantityDelta(-toDeduct)
                    .reason(resolvedType + " deduction for order item: " + (orderItemId != null ? orderItemId : "direct"))
                    .build();
            transactionRepository.save(tx);

            fulfillments.add(new FulfillmentResultDto(orderItemId, batch.getId(), toDeduct));
            remainingQty -= toDeduct;
        }

        if (remainingQty > 0) {
            throw new InsufficientStockException("Could not fulfill full requested quantity (" + requestedQuantity + ") from active batches for product: " + product.getName());
        }

        return fulfillments;
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
        List<OrderItemBatchFulfillment> fulfillments = fulfillmentRepository.findByOrderItem_Id(orderItemId);
        User actor = (actorUserId != null) ? userRepository.findById(actorUserId).orElse(null) : null;

        for (OrderItemBatchFulfillment fulfillment : fulfillments) {
            ProductBatch batch = fulfillment.getBatch();
            int qtyToRestore = fulfillment.getQuantityDeducted();

            batch.setCurrentQuantity(batch.getCurrentQuantity() + qtyToRestore);
            if (batch.getCurrentQuantity() > 0 && (batch.getExpiryDate() == null || batch.getExpiryDate().isAfter(LocalDate.now()))) {
                batch.setIsExpired(false);
            }
            batchRepository.save(batch);

            InventoryTransaction tx = InventoryTransaction.builder()
                    .batch(batch)
                    .user(actor)
                    .type(TransactionType.MANUAL_ADJUSTMENT)
                    .quantityDelta(qtyToRestore)
                    .reason("Restocked order item cancellation #" + orderItemId)
                    .build();
            transactionRepository.save(tx);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getLowStockAlerts() {
        return productRepository.findByIsDeletedFalse().stream()
                .filter(p -> {
                    int available = getAvailableStock(p.getId());
                    int threshold = p.getMinStockThreshold() != null ? p.getMinStockThreshold() : 10;
                    return available <= threshold;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductBatch> getExpiringBatches(int days) {
        LocalDate now = LocalDate.now();
        LocalDate limit = now.plusDays(days);
        return batchRepository.findAll().stream()
                .filter(b -> !Boolean.TRUE.equals(b.getIsExpired()) && b.getCurrentQuantity() != null && b.getCurrentQuantity() > 0)
                .filter(b -> b.getExpiryDate() != null && !b.getExpiryDate().isBefore(now) && !b.getExpiryDate().isAfter(limit))
                .sorted(java.util.Comparator.comparing(ProductBatch::getExpiryDate))
                .toList();
    }

    @Override
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void markExpiredBatches() {
        List<ProductBatch> expiredBatches = batchRepository.findByIsExpiredFalseAndExpiryDateLessThanEqual(LocalDate.now());
        for (ProductBatch batch : expiredBatches) {
            int currentQty = batch.getCurrentQuantity();
            batch.setIsExpired(true);
            batch.setCurrentQuantity(0);
            batchRepository.save(batch);

            if (currentQty > 0) {
                InventoryTransaction tx = InventoryTransaction.builder()
                        .batch(batch)
                        .user(null)
                        .type(TransactionType.EXPIRED_WRITE_OFF)
                        .quantityDelta(-currentQty)
                        .reason("Automated expiry write-off for batch " + batch.getBatchCode())
                        .build();
                transactionRepository.save(tx);
            }
        }
    }

    @Override
    @Transactional
    public InventoryTransaction adjustStock(Long batchId, int quantityDelta, String reason, Long staffUserId) {
        ProductBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Product batch not found with id: " + batchId));

        if (batch.getCurrentQuantity() + quantityDelta < 0) {
            throw new BadRequestException("Stock adjustment would result in negative batch quantity (" + (batch.getCurrentQuantity() + quantityDelta) + ")");
        }

        batch.setCurrentQuantity(batch.getCurrentQuantity() + quantityDelta);
        batchRepository.save(batch);

        User staff = (staffUserId != null) ? userRepository.findById(staffUserId).orElse(null) : null;
        InventoryTransaction tx = InventoryTransaction.builder()
                .batch(batch)
                .user(staff)
                .type(TransactionType.MANUAL_ADJUSTMENT)
                .quantityDelta(quantityDelta)
                .reason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Manual stock adjustment")
                .build();

        return transactionRepository.save(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductBatch> getBatchesByProduct(Long productId) {
        return batchRepository.findByProduct_IdOrderByReceivedAtDesc(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductBatch> getAllBatches() {
        return batchRepository.findAllByOrderByReceivedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getRecentTransactions() {
        return transactionRepository.findTop50ByOrderByCreatedAtDesc();
    }

    // ================= CONTRACT 2: ProductCatalogLookup =================
    @Override
    @Transactional(readOnly = true)
    public ProductPriceDto getPrices(Long productId) {
        Product product = getProductById(productId);
        int available = getAvailableStock(productId);
        return new ProductPriceDto(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getCostPrice(),
                product.getRetailPrice(),
                product.getWholesalePrice(),
                Boolean.TRUE.equals(product.getIsPerishable()),
                available
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProductAvailable(Long productId) {
        Product product = productRepository.findByIdAndIsDeletedFalse(productId).orElse(null);
        if (product == null) return false;
        return getAvailableStock(productId) > 0;
    }

    private void validatePricingHierarchy(BigDecimal costPrice, BigDecimal retailPrice, BigDecimal wholesalePrice) {
        if (costPrice == null || retailPrice == null || wholesalePrice == null) {
            throw new BadRequestException("Cost price, retail price, and wholesale price must not be null");
        }
        if (costPrice.compareTo(BigDecimal.ZERO) < 0 || retailPrice.compareTo(BigDecimal.ZERO) < 0 || wholesalePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Product prices must be non-negative");
        }
        if (costPrice.compareTo(retailPrice) > 0) {
            throw new BadRequestException("Cost price (" + costPrice + ") cannot exceed retail price (" + retailPrice + ")");
        }
        if (costPrice.compareTo(wholesalePrice) > 0) {
            throw new BadRequestException("Cost price (" + costPrice + ") cannot exceed wholesale price (" + wholesalePrice + ")");
        }
        if (wholesalePrice.compareTo(retailPrice) > 0) {
            throw new BadRequestException("Wholesale price (" + wholesalePrice + ") cannot exceed retail price (" + retailPrice + ")");
        }
    }
}

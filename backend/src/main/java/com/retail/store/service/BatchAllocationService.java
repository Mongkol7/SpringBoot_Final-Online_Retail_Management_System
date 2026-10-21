package com.retail.store.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BatchAllocationService {

    /**
     * Executes FIFO (non-perishable) or FEFO (perishable) deduction against active batches,
     * persists OrderItemBatchFulfillment records, and appends immutable InventoryTransaction entries.
     */
    List<FulfillmentResultDto> allocateAndDeductBatches(
            Long orderItemId,
            Long productId,
            int requestedQuantity,
            Long actorUserId,
            String transactionType
    );

    /**
     * Enum overload for convenience and type-safety across service boundaries.
     */
    default List<FulfillmentResultDto> allocateAndDeductBatches(
            Long orderItemId,
            Long productId,
            int requestedQuantity,
            Long actorUserId,
            com.retail.store.entity.enums.TransactionType type
    ) {
        return allocateAndDeductBatches(orderItemId, productId, requestedQuantity, actorUserId, type != null ? type.name() : null);
    }

    /**
     * Queries total available, non-expired stock for a product.
     */
    int getAvailableStock(Long productId);

    /**
     * Restores stock for an order item upon customer cancellation.
     */
    void restoreStockForOrderItem(Long orderItemId, Long actorUserId);

    /**
     * Retrieves the current active batch being sold/allocated for a product (FEFO earliest expiring or FIFO oldest intake).
     */
    default Optional<CurrentBatchInfoDto> getCurrentBatchInfo(Long productId) {
        return Optional.empty();
    }

    record FulfillmentResultDto(
            Long orderItemId,
            Long batchId,
            int quantityDeducted
    ) {}

    record CurrentBatchInfoDto(
            Long batchId,
            String batchCode,
            LocalDate expiryDate,
            int currentQuantity
    ) {}
}

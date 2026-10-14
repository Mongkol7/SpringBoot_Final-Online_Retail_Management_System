package com.retail.store.service;

import java.util.List;

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

    record FulfillmentResultDto(
            Long orderItemId,
            Long batchId,
            int quantityDeducted
    ) {}
}

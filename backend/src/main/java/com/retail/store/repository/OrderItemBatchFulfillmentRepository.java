package com.retail.store.repository;

import com.retail.store.entity.OrderItemBatchFulfillment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemBatchFulfillmentRepository extends JpaRepository<OrderItemBatchFulfillment, Long> {
    List<OrderItemBatchFulfillment> findByOrderItem_Id(Long orderItemId);
}

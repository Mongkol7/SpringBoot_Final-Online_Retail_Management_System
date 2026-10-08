package com.retail.store.repository;

import com.retail.store.entity.Order;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByUser_Id(Long userId, Pageable pageable);
    Page<Order> findByChannel(OrderChannel channel, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != 'CANCELLED'")
    BigDecimal calculateGrossRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.channel = :channel AND o.status != 'CANCELLED'")
    BigDecimal calculateRevenueByChannel(OrderChannel channel);

    long countByChannel(OrderChannel channel);

    long countByCreatedAtAfter(LocalDateTime since);
}

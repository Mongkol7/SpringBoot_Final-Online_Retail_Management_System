package com.retail.store.repository;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    Page<InventoryTransaction> findByType(TransactionType type, Pageable pageable);
    Page<InventoryTransaction> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<InventoryTransaction> findByBatch_Id(Long batchId, Pageable pageable);
}

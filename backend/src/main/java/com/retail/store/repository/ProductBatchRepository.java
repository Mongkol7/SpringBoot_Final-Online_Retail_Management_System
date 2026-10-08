package com.retail.store.repository;

import com.retail.store.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    Optional<ProductBatch> findByBatchCode(String batchCode);

    // FEFO: Perishable goods sorted by expiryDate ASC, then receivedAt ASC
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId " +
           "AND b.isExpired = false AND b.currentQuantity > 0 " +
           "AND (b.expiryDate IS NULL OR b.expiryDate > :currentDate) " +
           "ORDER BY b.expiryDate ASC NULLS LAST, b.receivedAt ASC")
    List<ProductBatch> findActiveBatchesFEFO(@Param("productId") Long productId, @Param("currentDate") LocalDate currentDate);

    // FIFO: Non-perishable goods sorted by receivedAt ASC, then id ASC
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId " +
           "AND b.isExpired = false AND b.currentQuantity > 0 " +
           "ORDER BY b.receivedAt ASC, b.id ASC")
    List<ProductBatch> findActiveBatchesFIFO(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(b.currentQuantity), 0) FROM ProductBatch b " +
           "WHERE b.product.id = :productId AND b.isExpired = false AND b.currentQuantity > 0 " +
           "AND (b.expiryDate IS NULL OR b.expiryDate > :currentDate)")
    int sumAvailableStock(@Param("productId") Long productId, @Param("currentDate") LocalDate currentDate);

    List<ProductBatch> findByIsExpiredFalseAndExpiryDateLessThanEqual(LocalDate date);

    long countByIsExpiredTrue();
}

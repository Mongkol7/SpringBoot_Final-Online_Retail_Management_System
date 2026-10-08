package com.retail.store.repository;

import com.retail.store.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySkuAndIsDeletedFalse(String sku);
    Optional<Product> findByIdAndIsDeletedFalse(Long id);
    List<Product> findByIsDeletedFalseOrderByNameAsc();
    Page<Product> findByIsDeletedFalse(Pageable pageable);
    Page<Product> findByCategory_IdAndIsDeletedFalse(Integer categoryId, Pageable pageable);
    Page<Product> findByNameContainingIgnoreCaseAndIsDeletedFalse(String keyword, Pageable pageable);
}

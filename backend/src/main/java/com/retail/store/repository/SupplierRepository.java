package com.retail.store.repository;

import com.retail.store.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    Optional<Supplier> findByName(String name);
    boolean existsByName(String name);
    List<Supplier> findByIsDeletedFalse();
    List<Supplier> findByIsDeletedFalseOrderByNameAsc();
}

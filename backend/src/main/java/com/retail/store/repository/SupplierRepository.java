package com.retail.store.repository;

import com.retail.store.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    List<Supplier> findByIsDeletedFalse();
    List<Supplier> findByIsDeletedFalseOrderByNameAsc();
}

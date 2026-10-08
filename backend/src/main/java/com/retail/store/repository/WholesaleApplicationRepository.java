package com.retail.store.repository;

import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WholesaleApplicationRepository extends JpaRepository<WholesaleApplication, Long> {
    List<WholesaleApplication> findByUser_Id(Long userId);
    Optional<WholesaleApplication> findTopByUser_IdOrderByCreatedAtDesc(Long userId);
    Page<WholesaleApplication> findByStatus(ApplicationStatus status, Pageable pageable);
    long countByStatus(ApplicationStatus status);
}

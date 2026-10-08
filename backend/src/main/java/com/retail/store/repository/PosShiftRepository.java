package com.retail.store.repository;

import com.retail.store.entity.PosShift;
import com.retail.store.entity.enums.PosShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PosShiftRepository extends JpaRepository<PosShift, Long> {
    Optional<PosShift> findTopByCashier_IdAndStatusOrderByOpenedAtDesc(Long cashierId, PosShiftStatus status);
    List<PosShift> findByCashier_IdOrderByOpenedAtDesc(Long cashierId);
    boolean existsByCashier_IdAndStatus(Long cashierId, PosShiftStatus status);
}

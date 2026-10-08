package com.retail.store.service;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface AdminService {
    WholesaleApplication approveWholesale(Long applicationId, Long adminUserId);
    WholesaleApplication rejectWholesale(Long applicationId, Long adminUserId, String rejectionNotes);
    Page<WholesaleApplication> getWholesaleApplications(String status, Pageable pageable);

    User toggleUserActive(Long targetUserId);
    User changeUserRole(Long targetUserId, String roleName);
    Page<User> getAllUsers(Pageable pageable);

    Page<InventoryTransaction> getAuditLogs(Pageable pageable);
    ExecutiveKpiSummary getDashboardSummary();

    record ExecutiveKpiSummary(
            BigDecimal totalGrossRevenue,
            BigDecimal onlineRevenue,
            BigDecimal posRevenue,
            long onlineOrdersCount,
            long posOrdersCount,
            long pendingWholesaleApplicationsCount,
            long expiredBatchesCount,
            int lowStockProductsCount
    ) {}
}

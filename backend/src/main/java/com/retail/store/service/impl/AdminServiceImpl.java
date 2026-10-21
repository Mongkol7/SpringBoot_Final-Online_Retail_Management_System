package com.retail.store.service.impl;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.repository.InventoryTransactionRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductBatchRepository;
import com.retail.store.repository.RoleRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.service.AdminService;
import com.retail.store.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 4 (ADMIN Role)
 * =========================================================================
 * Responsibilities:
 * 1. Wholesale Application Governance:
 * - Review pending wholesale applications.
 * - Approval workflow: Atomically change application status to APPROVED,
 * and upgrade applicant User customerType to CustomerType.WHOLESALE.
 * - Rejection workflow: Change status to REJECTED with adminNotes.
 * 2. User Directory & Status Governance:
 * - Toggle user isActive flag (lock/unlock account).
 * - Change user role (e.g. promote USER to CASHIER or STOCK_CONTROLLER).
 * 3. Immutable Stock Audit Ledger Query (audit logs).
 * 4. Executive HUD KPI Analytics:
 * - Total gross revenue, channel revenue (Online vs POS).
 * - Online vs POS order counts.
 * - Pending wholesale queue count, expired batch count, low stock count.
 * =========================================================================
 */
@Service
public class AdminServiceImpl implements AdminService {

    private final WholesaleApplicationRepository wholesaleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrderRepository orderRepository;
    private final ProductBatchRepository batchRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final InventoryService inventoryService;

    public AdminServiceImpl(WholesaleApplicationRepository wholesaleRepository,
                            UserRepository userRepository,
                            RoleRepository roleRepository,
                            OrderRepository orderRepository,
                            ProductBatchRepository batchRepository,
                            InventoryTransactionRepository transactionRepository,
                            InventoryService inventoryService) {
        this.wholesaleRepository = wholesaleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.orderRepository = orderRepository;
        this.batchRepository = batchRepository;
        this.transactionRepository = transactionRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional
    public WholesaleApplication approveWholesale(Long applicationId, Long adminUserId) {
        //  1. Find WholesaleApplication by applicationId
        WholesaleApplication application = wholesaleRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Wholesale application not found: " + applicationId
                        )
                );
        // Find admin user
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Admin user not found: " + adminUserId
                        )
                );
        //  2. Set status = APPROVED, reviewedBy = adminUser, reviewedAt = now
        application.setStatus(ApplicationStatus.APPROVED);
        application.setReviewedBy(adminUser);
        application.setReviewedAt(LocalDateTime.now());
        //  3. Atomically update target User customerType = CustomerType.WHOLESALE
        User customer = application.getUser();
        customer.setCustomerType(CustomerType.WHOLESALE);

        userRepository.save(customer);
        // Save application
        return wholesaleRepository.save(application);
    }

    @Override
    @Transactional
    public WholesaleApplication rejectWholesale(Long applicationId, Long adminUserId, String rejectionNotes) {
        // Set status = REJECTED, reviewedBy = adminUser, adminNotes = rejectionNotes
        WholesaleApplication application = wholesaleRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Wholesale application not found: " + applicationId
                        )
                );
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Admin user not found: " + adminUserId
                        )
                );
        application.setReviewedBy(adminUser);
        application.setReviewedAt(LocalDateTime.now());
        application.setAdminNotes(rejectionNotes);

        return wholesaleRepository.save(application);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WholesaleApplication> getWholesaleApplications(String status, Pageable pageable) {
        if (status == null || status.isBlank()) {
            return wholesaleRepository.findAll(pageable);
        }

        ApplicationStatus applicationStatus;

        try {
            applicationStatus = ApplicationStatus.valueOf(
                    status.toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid wholesale application status: " + status
            );
        }

        return wholesaleRepository
                .findByStatus(applicationStatus, pageable);
    }

    @Override
    @Transactional
    public User toggleUserActive(Long targetUserId) {
        // Find user and toggle isActive (true -> false or false -> true)
        // 1. Find user
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + targetUserId
                        )
                );
        // 2. Toggle active status
        user.setIsActive(!user.getIsActive());
        // 3. Save and return
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User changeUserRole(Long targetUserId, String roleName) {
        //  Find role by roleName and update user.setRole(role)
        // 1. Find user
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + targetUserId
                        )
                );

        // 2. Find role
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + roleName
                        )
                );

        // 3. Update user's role
        user.setRole(role);

        // 4. Save and return
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        //  Return paginated list of all registered users
        return userRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransaction> getAuditLogs(Pageable pageable) {
        //  Return paginated immutable inventory transaction audit trail
        return transactionRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ExecutiveKpiSummary getDashboardSummary() {
        // Aggregate executive metrics from orderRepository, wholesaleRepository, batchRepository
        return new ExecutiveKpiSummary(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0,
                0,
                0,
                0,
                0
        );
    }
}

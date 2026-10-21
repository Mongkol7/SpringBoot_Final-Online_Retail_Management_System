package com.retail.store.service.impl;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.Order;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderStatus;
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
 *    - Review pending wholesale applications.
 *    - Approval workflow: Atomically change application status to APPROVED,
 *      and upgrade applicant User customerType to CustomerType.WHOLESALE.
 *    - Rejection workflow: Change status to REJECTED with adminNotes.
 * 2. User Directory & Status Governance:
 *    - Toggle user isActive flag (lock/unlock account).
 *    - Change user role (e.g. promote USER to CASHIER or STOCK_CONTROLLER).
 * 3. Immutable Stock Audit Ledger Query (audit logs).
 * 4. Executive HUD KPI Analytics:
 *    - Total gross revenue, channel revenue (Online vs POS).
 *    - Online vs POS order counts.
 *    - Pending wholesale queue count, expired batch count, low stock count.
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
        WholesaleApplication app = wholesaleRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Wholesale application not found with id: " + applicationId));

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with id: " + adminUserId));

        app.setStatus(ApplicationStatus.APPROVED);
        app.setReviewedBy(admin);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminNotes("Approved by Administrator: " + admin.getFullName());

        // Atomically upgrade customer to WHOLESALE tier
        User targetUser = app.getUser();
        targetUser.setCustomerType(CustomerType.WHOLESALE);
        userRepository.save(targetUser);

        return wholesaleRepository.save(app);
    }

    @Override
    @Transactional
    public WholesaleApplication rejectWholesale(Long applicationId, Long adminUserId, String rejectionNotes) {
        WholesaleApplication app = wholesaleRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Wholesale application not found with id: " + applicationId));

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with id: " + adminUserId));

        app.setStatus(ApplicationStatus.REJECTED);
        app.setReviewedBy(admin);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminNotes(rejectionNotes != null ? rejectionNotes : "Application rejected by administrator.");

        return wholesaleRepository.save(app);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WholesaleApplication> getWholesaleApplications(String status, Pageable pageable) {
        if (status != null && !status.trim().isEmpty()) {
            try {
                ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase().trim());
                return wholesaleRepository.findByStatus(appStatus, pageable);
            } catch (IllegalArgumentException ignored) {}
        }
        return wholesaleRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public User toggleUserActive(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));
        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User changeUserRole(Long targetUserId, String roleName) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));
        com.retail.store.entity.Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + roleName));
        user.setRole(role);
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        // TODO [Person 4]: Return paginated list of all registered users
        return userRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransaction> getAuditLogs(Pageable pageable) {
        // TODO [Person 4]: Return paginated immutable inventory transaction audit trail
        return transactionRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ExecutiveKpiSummary getDashboardSummary() {
        // TODO [Person 4]: Aggregate executive metrics from orderRepository, wholesaleRepository, batchRepository
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

    @Override
    @Transactional
    public Order confirmOrder(Long orderId, Long adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        order.setStatus(OrderStatus.PROCESSING);
        return orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Order> getAllOrders(String status, Pageable pageable) {
        if (status != null && !status.trim().isEmpty()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase().trim());
                return orderRepository.findByStatus(orderStatus, pageable);
            } catch (IllegalArgumentException ignored) {}
        }
        return orderRepository.findAll(pageable);
    }
}

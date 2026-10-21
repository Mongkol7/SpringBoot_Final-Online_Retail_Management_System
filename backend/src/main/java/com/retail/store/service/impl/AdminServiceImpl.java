package com.retail.store.service.impl;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Order;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.entity.Product;
import com.retail.store.entity.ProductBatch;
import com.retail.store.repository.InventoryTransactionRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductBatchRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.RoleRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.service.AdminService;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
 * 5. Complete Product Catalog, Multi-Tier Margins & Inventory Intelligence.
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
    private final ProductRepository productRepository;
    private final BatchAllocationService batchAllocationService;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(WholesaleApplicationRepository wholesaleRepository,
                            UserRepository userRepository,
                            RoleRepository roleRepository,
                            OrderRepository orderRepository,
                            ProductBatchRepository batchRepository,
                            InventoryTransactionRepository transactionRepository,
                            InventoryService inventoryService,
                            ProductRepository productRepository,
                            BatchAllocationService batchAllocationService,
                            PasswordEncoder passwordEncoder) {
        this.wholesaleRepository = wholesaleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.orderRepository = orderRepository;
        this.batchRepository = batchRepository;
        this.transactionRepository = transactionRepository;
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.batchAllocationService = batchAllocationService;
        this.passwordEncoder = passwordEncoder != null ? passwordEncoder : new BCryptPasswordEncoder(12);
    }

    public AdminServiceImpl(WholesaleApplicationRepository wholesaleRepository,
                            UserRepository userRepository,
                            RoleRepository roleRepository,
                            OrderRepository orderRepository,
                            ProductBatchRepository batchRepository,
                            InventoryTransactionRepository transactionRepository,
                            InventoryService inventoryService,
                            ProductRepository productRepository,
                            BatchAllocationService batchAllocationService) {
        this(wholesaleRepository, userRepository, roleRepository, orderRepository,
             batchRepository, transactionRepository, inventoryService, productRepository,
             batchAllocationService, null);
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
        application.setStatus(ApplicationStatus.REJECTED);
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
    @Transactional
    public User createUser(CreateUserRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("User email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(cleanEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already registered: " + cleanEmail);
        }

        String roleName = request.roleName() != null && !request.roleName().isBlank()
                ? request.roleName().trim().toUpperCase()
                : "USER";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        CustomerType customerType = CustomerType.RETAIL;
        if (request.customerType() != null && !request.customerType().isBlank()) {
            try {
                customerType = CustomerType.valueOf(request.customerType().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        } else if ("WHOLESALE".equalsIgnoreCase(roleName)) {
            customerType = CustomerType.WHOLESALE;
        }

        String rawPassword = request.password() != null && !request.password().isBlank()
                ? request.password().trim()
                : "Welcome123!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        User newUser = User.builder()
                .role(role)
                .email(cleanEmail)
                .passwordHash(encodedPassword)
                .fullName(request.fullName() != null && !request.fullName().isBlank() ? request.fullName().trim() : "New User")
                .phone(request.phone() != null ? request.phone().trim() : "")
                .customerType(customerType)
                .isActive(true)
                .build();

        return userRepository.save(newUser);
    }

    @Override
    @Transactional
    public User updateUser(Long targetUserId, UpdateUserRequest request) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        if (request.email() != null && !request.email().isBlank()) {
            String newEmail = request.email().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.findByEmail(newEmail).isPresent()) {
                throw new IllegalArgumentException("Email is already in use by another account: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }

        if (request.phone() != null) {
            user.setPhone(request.phone().trim());
        }

        if (request.roleName() != null && !request.roleName().isBlank()) {
            String roleName = request.roleName().trim().toUpperCase();
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
            user.setRole(role);
        }

        if (request.customerType() != null && !request.customerType().isBlank()) {
            try {
                user.setCustomerType(CustomerType.valueOf(request.customerType().trim().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password().trim()));
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        try {
            userRepository.delete(user);
        } catch (Exception ex) {
            // When orders, shifts, or audit records reference user, safely deactivate
            user.setIsActive(false);
            userRepository.save(user);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransaction> getAuditLogs(String type, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        TransactionType txType = null;
        if (type != null && !type.isBlank()) {
            try {
                txType = TransactionType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        if (txType != null && start != null && end != null) {
            return transactionRepository.findByTypeAndCreatedAtBetween(txType, start, end, pageable);
        } else if (txType != null) {
            return transactionRepository.findByType(txType, pageable);
        } else if (start != null && end != null) {
            return transactionRepository.findByCreatedAtBetween(start, end, pageable);
        }
        return transactionRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ExecutiveKpiSummary getDashboardSummary() {
        BigDecimal grossRevenue = orderRepository.calculateGrossRevenue();
        if (grossRevenue == null) grossRevenue = BigDecimal.ZERO;

        BigDecimal onlineRevenue = orderRepository.calculateRevenueByChannel(OrderChannel.ONLINE);
        if (onlineRevenue == null) onlineRevenue = BigDecimal.ZERO;

        BigDecimal posRevenue = orderRepository.calculateRevenueByChannel(OrderChannel.POS);
        if (posRevenue == null) posRevenue = BigDecimal.ZERO;

        long onlineOrders = orderRepository.countByChannel(OrderChannel.ONLINE);
        long posOrders = orderRepository.countByChannel(OrderChannel.POS);
        long pendingWholesale = wholesaleRepository.countByStatus(ApplicationStatus.PENDING);
        long expiredBatches = batchRepository.countByIsExpiredTrue();
        int lowStockCount = inventoryService.getLowStockAlerts() != null ? inventoryService.getLowStockAlerts().size() : 0;

        return new ExecutiveKpiSummary(
                grossRevenue,
                onlineRevenue,
                posRevenue,
                onlineOrders,
                posOrders,
                pendingWholesale,
                expiredBatches,
                lowStockCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesSeriesPointDto> getSalesSeries(int days) {
        return getSalesSeries(days, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesSeriesPointDto> getSalesSeries(int days, Integer year) {
        if (year != null && year >= 2000 && year <= 2100) {
            LocalDateTime startOfYear = LocalDateTime.of(year, 1, 1, 0, 0, 0);
            LocalDateTime endOfYear = LocalDateTime.of(year, 12, 31, 23, 59, 59);

            List<Order> orders = orderRepository.findAll().stream()
                    .filter(o -> o.getCreatedAt() != null &&
                            !o.getCreatedAt().isBefore(startOfYear) &&
                            !o.getCreatedAt().isAfter(endOfYear) &&
                            o.getStatus() != com.retail.store.entity.enums.OrderStatus.CANCELLED)
                    .toList();

            List<SalesSeriesPointDto> series = new ArrayList<>();
            for (int m = 1; m <= 12; m++) {
                String monthStr = String.format("%d-%02d", year, m);
                BigDecimal onlineRev = BigDecimal.ZERO;
                BigDecimal posRev = BigDecimal.ZERO;
                long count = 0;

                for (Order o : orders) {
                    if (o.getCreatedAt().getMonthValue() == m) {
                        count++;
                        BigDecimal amt = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                        if (o.getChannel() == OrderChannel.ONLINE) {
                            onlineRev = onlineRev.add(amt);
                        } else if (o.getChannel() == OrderChannel.POS) {
                            posRev = posRev.add(amt);
                        }
                    }
                }

                BigDecimal totalRev = onlineRev.add(posRev);
                series.add(new SalesSeriesPointDto(
                        monthStr,
                        onlineRev.setScale(2, RoundingMode.HALF_UP),
                        posRev.setScale(2, RoundingMode.HALF_UP),
                        totalRev.setScale(2, RoundingMode.HALF_UP),
                        count
                ));
            }

            return series;
        }

        int windowDays = (days <= 0 || days > 365) ? 7 : days;
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(windowDays - 1);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null &&
                        !o.getCreatedAt().isBefore(startDateTime) &&
                        o.getCreatedAt().isBefore(endDateTime) &&
                        o.getStatus() != com.retail.store.entity.enums.OrderStatus.CANCELLED)
                .toList();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<SalesSeriesPointDto> series = new ArrayList<>();

        for (int i = 0; i < windowDays; i++) {
            LocalDate day = startDate.plusDays(i);
            String dayStr = day.format(formatter);

            BigDecimal onlineRev = BigDecimal.ZERO;
            BigDecimal posRev = BigDecimal.ZERO;
            long count = 0;

            for (Order o : orders) {
                if (o.getCreatedAt().toLocalDate().isEqual(day)) {
                    count++;
                    BigDecimal amt = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                    if (o.getChannel() == OrderChannel.ONLINE) {
                        onlineRev = onlineRev.add(amt);
                    } else if (o.getChannel() == OrderChannel.POS) {
                        posRev = posRev.add(amt);
                    }
                }
            }

            BigDecimal totalRev = onlineRev.add(posRev);
            series.add(new SalesSeriesPointDto(
                    dayStr,
                    onlineRev.setScale(2, RoundingMode.HALF_UP),
                    posRev.setScale(2, RoundingMode.HALF_UP),
                    totalRev.setScale(2, RoundingMode.HALF_UP),
                    count
            ));
        }

        return series;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProductDetailDto> getAllProducts() {
        return productRepository.findByIsDeletedFalseOrderByNameAsc().stream()
                .map(this::mapToAdminProductDetail)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProductDetailDto getProductDetail(Long productId) {
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));
        return mapToAdminProductDetail(product);
    }

    private AdminProductDetailDto mapToAdminProductDetail(Product product) {
        int availableStock = batchAllocationService.getAvailableStock(product.getId());
        var batchInfo = batchAllocationService.getCurrentBatchInfo(product.getId()).orElse(null);

        BigDecimal cost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
        BigDecimal retail = product.getRetailPrice() != null ? product.getRetailPrice() : BigDecimal.ZERO;
        BigDecimal wholesale = product.getWholesalePrice() != null ? product.getWholesalePrice() : BigDecimal.ZERO;

        BigDecimal retailMargin = BigDecimal.ZERO;
        if (retail.compareTo(BigDecimal.ZERO) > 0 && cost.compareTo(BigDecimal.ZERO) >= 0) {
            retailMargin = retail.subtract(cost)
                    .divide(retail, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        BigDecimal wholesaleMargin = BigDecimal.ZERO;
        if (wholesale.compareTo(BigDecimal.ZERO) > 0 && cost.compareTo(BigDecimal.ZERO) >= 0) {
            wholesaleMargin = wholesale.subtract(cost)
                    .divide(wholesale, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        List<ProductBatch> dbBatches = batchRepository.findByProduct_IdOrderByReceivedAtDesc(product.getId());
        List<BatchItemDto> batchDtos = dbBatches.stream()
                .map(b -> new BatchItemDto(
                        b.getId(),
                        b.getBatchCode(),
                        b.getInitialQuantity(),
                        b.getCurrentQuantity(),
                        b.getExpiryDate(),
                        Boolean.TRUE.equals(b.getIsExpired()),
                        b.getReceivedAt()
                ))
                .toList();

        return new AdminProductDetailDto(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getCategory() != null ? product.getCategory().getName() : "General",
                product.getImageUrl(),
                cost,
                retail,
                wholesale,
                retailMargin,
                wholesaleMargin,
                availableStock,
                product.getMinStockThreshold() != null ? product.getMinStockThreshold() : 10,
                Boolean.TRUE.equals(product.getIsPerishable()),
                batchInfo != null ? batchInfo.batchCode() : null,
                batchInfo != null ? batchInfo.expiryDate() : null,
                batchDtos
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminPaymentDto> getAllPayments(String channel, String paymentMethod, String status, String customerCategory) {
        return orderRepository.findAll().stream()
                .filter(o -> {
                    if (channel != null && !channel.equalsIgnoreCase("ALL")) {
                        if (o.getChannel() == null || !o.getChannel().name().equalsIgnoreCase(channel)) return false;
                    }
                    if (paymentMethod != null && !paymentMethod.equalsIgnoreCase("ALL")) {
                        if (o.getPaymentMethod() == null || !o.getPaymentMethod().name().equalsIgnoreCase(paymentMethod)) return false;
                    }
                    if (status != null && !status.equalsIgnoreCase("ALL")) {
                        if (o.getStatus() == null || !o.getStatus().name().equalsIgnoreCase(status)) return false;
                    }
                    if (customerCategory != null && !customerCategory.equalsIgnoreCase("ALL")) {
                        boolean isWholesale = (o.getPricingTierUsed() != null && "WHOLESALE".equalsIgnoreCase(o.getPricingTierUsed().name()))
                                || (o.getUser() != null && o.getUser().getCustomerType() != null && "WHOLESALE".equalsIgnoreCase(o.getUser().getCustomerType().name()));
                        String cat = isWholesale ? "WHOLESALE" : (o.getChannel() == OrderChannel.ONLINE ? "ONLINE" : "WALK_IN");

                        if (customerCategory.equalsIgnoreCase("CUSTOMER") || customerCategory.equalsIgnoreCase("RETAIL")) {
                            if (isWholesale) return false;
                        } else if (!cat.equalsIgnoreCase(customerCategory)) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapOrderToPaymentDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSpendingSummaryDto> getCustomerSpendingSummary(String customerCategory) {
        List<AdminPaymentDto> payments = getAllPayments("ALL", "ALL", "ALL", customerCategory);

        Map<String, List<AdminPaymentDto>> grouped = payments.stream()
                .collect(Collectors.groupingBy(p -> (p.customerName() != null ? p.customerName().trim() : "Walk-in Guest") + "::" + (p.customerEmail() != null ? p.customerEmail().trim() : "")));

        List<CustomerSpendingSummaryDto> summaries = new ArrayList<>();

        for (Map.Entry<String, List<AdminPaymentDto>> entry : grouped.entrySet()) {
            List<AdminPaymentDto> customerPayments = entry.getValue();
            if (customerPayments.isEmpty()) continue;

            AdminPaymentDto first = customerPayments.get(0);
            String name = first.customerName() != null ? first.customerName() : "Walk-in Guest";
            String email = first.customerEmail();
            String cat = first.customerCategory();
            String tier = first.pricingTierUsed();

            BigDecimal totalSpending = BigDecimal.ZERO;
            BigDecimal totalNet = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            int totalItems = 0;
            LocalDateTime latestDate = null;

            for (AdminPaymentDto p : customerPayments) {
                totalSpending = totalSpending.add(p.totalAmount() != null ? p.totalAmount() : BigDecimal.ZERO);
                totalNet = totalNet.add(p.subtotal() != null ? p.subtotal() : BigDecimal.ZERO);
                totalTax = totalTax.add(p.taxAmount() != null ? p.taxAmount() : BigDecimal.ZERO);
                totalItems += p.itemCount();
                if (p.createdAt() != null) {
                    if (latestDate == null || p.createdAt().isAfter(latestDate)) {
                        latestDate = p.createdAt();
                    }
                }
            }

            BigDecimal aov = !customerPayments.isEmpty()
                    ? totalSpending.divide(BigDecimal.valueOf(customerPayments.size()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            summaries.add(new CustomerSpendingSummaryDto(
                    name,
                    email,
                    cat,
                    tier,
                    customerPayments.size(),
                    totalItems,
                    totalSpending.setScale(2, RoundingMode.HALF_UP),
                    totalNet.setScale(2, RoundingMode.HALF_UP),
                    totalTax.setScale(2, RoundingMode.HALF_UP),
                    aov,
                    latestDate,
                    customerPayments
            ));
        }

        summaries.sort((a, b) -> b.totalSpending().compareTo(a.totalSpending()));
        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentDto getPaymentDetail(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for order: " + orderNumber));
        return mapOrderToPaymentDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialTaxReportDto getFinancialTaxReport() {
        List<Order> validOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() != null && !o.getStatus().name().equalsIgnoreCase("CANCELLED"))
                .toList();

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal posGross = BigDecimal.ZERO;
        BigDecimal posTax = BigDecimal.ZERO;
        BigDecimal onlineGross = BigDecimal.ZERO;
        BigDecimal onlineTax = BigDecimal.ZERO;
        BigDecimal cardTotal = BigDecimal.ZERO;
        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal bankTransferTotal = BigDecimal.ZERO;
        long posCount = 0;
        long onlineCount = 0;

        for (Order o : validOrders) {
            BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal tax = o.getTaxAmount() != null ? o.getTaxAmount() : BigDecimal.ZERO;

            totalGross = totalGross.add(amount);
            totalTax = totalTax.add(tax);

            if (o.getChannel() == OrderChannel.POS) {
                posGross = posGross.add(amount);
                posTax = posTax.add(tax);
                posCount++;
            } else {
                onlineGross = onlineGross.add(amount);
                onlineTax = onlineTax.add(tax);
                onlineCount++;
            }

            if (o.getPaymentMethod() != null) {
                switch (o.getPaymentMethod()) {
                    case CARD -> cardTotal = cardTotal.add(amount);
                    case CASH -> cashTotal = cashTotal.add(amount);
                    case BANK_TRANSFER -> bankTransferTotal = bankTransferTotal.add(amount);
                }
            }
        }

        BigDecimal netRevenue = totalGross.subtract(totalTax);

        return new FinancialTaxReportDto(
                totalGross.setScale(2, RoundingMode.HALF_UP),
                totalTax.setScale(2, RoundingMode.HALF_UP),
                netRevenue.setScale(2, RoundingMode.HALF_UP),
                posGross.setScale(2, RoundingMode.HALF_UP),
                posTax.setScale(2, RoundingMode.HALF_UP),
                onlineGross.setScale(2, RoundingMode.HALF_UP),
                onlineTax.setScale(2, RoundingMode.HALF_UP),
                cardTotal.setScale(2, RoundingMode.HALF_UP),
                cashTotal.setScale(2, RoundingMode.HALF_UP),
                bankTransferTotal.setScale(2, RoundingMode.HALF_UP),
                validOrders.size(),
                posCount,
                onlineCount,
                LocalDateTime.now()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public String generateFinancialTaxCsv() {
        List<Order> orders = orderRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("Order Number,Date,Channel,Payment Method,Status,Customer Name,Customer Email,Cashier,Items Count,Subtotal,Tax Amount,Total Amount\n");

        for (Order o : orders) {
            String customerName = o.getUser() != null ? escapeCsv(o.getUser().getFullName()) : "Walk-in Customer";
            String customerEmail = o.getUser() != null ? escapeCsv(o.getUser().getEmail()) : "N/A";
            String cashierName = o.getCashier() != null ? escapeCsv(o.getCashier().getFullName()) : "Online Checkout";
            int itemsCount = o.getItems() != null ? o.getItems().stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum() : 0;
            String dateStr = o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "N/A";

            sb.append(escapeCsv(o.getOrderNumber())).append(",")
                    .append(dateStr).append(",")
                    .append(o.getChannel() != null ? o.getChannel().name() : "N/A").append(",")
                    .append(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "N/A").append(",")
                    .append(o.getStatus() != null ? o.getStatus().name() : "N/A").append(",")
                    .append(customerName).append(",")
                    .append(customerEmail).append(",")
                    .append(cashierName).append(",")
                    .append(itemsCount).append(",")
                    .append(o.getSubtotal() != null ? o.getSubtotal().setScale(2, RoundingMode.HALF_UP) : "0.00").append(",")
                    .append(o.getTaxAmount() != null ? o.getTaxAmount().setScale(2, RoundingMode.HALF_UP) : "0.00").append(",")
                    .append(o.getTotalAmount() != null ? o.getTotalAmount().setScale(2, RoundingMode.HALF_UP) : "0.00")
                    .append("\n");
        }
        return sb.toString();
    }

    private AdminPaymentDto mapOrderToPaymentDto(Order o) {
        List<AdminPaymentItemDto> itemDtos = o.getItems() != null ? o.getItems().stream()
                .map(item -> new AdminPaymentItemDto(
                        item.getId(),
                        item.getProduct() != null ? item.getProduct().getName() : "Item",
                        item.getProduct() != null ? item.getProduct().getSku() : "N/A",
                        item.getProduct() != null ? item.getProduct().getImageUrl() : null,
                        item.getQuantity() != null ? item.getQuantity() : 0,
                        item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO,
                        item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO
                ))
                .toList() : List.of();

        int totalItems = itemDtos.stream().mapToInt(AdminPaymentItemDto::quantity).sum();

        boolean isWholesale = (o.getPricingTierUsed() != null && "WHOLESALE".equalsIgnoreCase(o.getPricingTierUsed().name()))
                || (o.getUser() != null && o.getUser().getCustomerType() != null && "WHOLESALE".equalsIgnoreCase(o.getUser().getCustomerType().name()));
        String category = isWholesale ? "WHOLESALE" : (o.getChannel() == OrderChannel.ONLINE ? "ONLINE" : "WALK_IN");

        return new AdminPaymentDto(
                o.getId(),
                o.getOrderNumber(),
                o.getChannel() != null ? o.getChannel().name() : "POS",
                o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "CARD",
                o.getStatus() != null ? o.getStatus().name() : "PENDING",
                o.getPricingTierUsed() != null ? o.getPricingTierUsed().name() : "RETAIL",
                category,
                o.getUser() != null ? o.getUser().getFullName() : "Walk-in Guest",
                o.getUser() != null ? o.getUser().getEmail() : "N/A",
                o.getCashier() != null ? o.getCashier().getFullName() : "Self-Serve Online",
                totalItems,
                o.getSubtotal() != null ? o.getSubtotal() : BigDecimal.ZERO,
                o.getTaxAmount() != null ? o.getTaxAmount() : BigDecimal.ZERO,
                o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO,
                o.getCreatedAt(),
                itemDtos
        );
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

package com.retail.store.service;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Order;
import com.retail.store.entity.Product;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.repository.InventoryTransactionRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductBatchRepository;
import com.retail.store.repository.RoleRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private WholesaleApplicationRepository wholesaleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductBatchRepository batchRepository;

    @Mock
    private InventoryTransactionRepository transactionRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private BatchAllocationService batchAllocationService;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User adminUser;
    private User customerUser;
    private Role adminRole;
    private Role userRole;
    private Role cashierRole;
    private WholesaleApplication pendingApp;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
                wholesaleRepository,
                userRepository,
                roleRepository,
                orderRepository,
                batchRepository,
                transactionRepository,
                inventoryService,
                productRepository,
                batchAllocationService
        );

        adminRole = new Role(1, "ADMIN");
        userRole = new Role(2, "USER");
        cashierRole = new Role(3, "CASHIER");

        adminUser = User.builder()
                .id(1L)
                .email("admin@retailstore.com")
                .fullName("System Administrator")
                .role(adminRole)
                .isActive(true)
                .build();

        customerUser = User.builder()
                .id(2L)
                .email("client@example.com")
                .fullName("B2B Customer")
                .role(userRole)
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();

        pendingApp = WholesaleApplication.builder()
                .id(10L)
                .user(customerUser)
                .businessName("Apex Retail Ltd")
                .taxIdOrLicense("TAX-998877")
                .status(ApplicationStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("approveWholesale: Atomically sets status to APPROVED and upgrades customer to WHOLESALE")
    void testApproveWholesale_Success() {
        when(wholesaleRepository.findById(10L)).thenReturn(Optional.of(pendingApp));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(wholesaleRepository.save(any(WholesaleApplication.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WholesaleApplication result = adminService.approveWholesale(10L, 1L);

        assertNotNull(result);
        assertEquals(ApplicationStatus.APPROVED, result.getStatus());
        assertEquals(adminUser, result.getReviewedBy());
        assertNotNull(result.getReviewedAt());
        assertEquals(CustomerType.WHOLESALE, customerUser.getCustomerType());

        verify(userRepository).save(customerUser);
        verify(wholesaleRepository).save(pendingApp);
    }

    @Test
    @DisplayName("approveWholesale: Throws ResourceNotFoundException when application not found")
    void testApproveWholesale_ApplicationNotFound() {
        when(wholesaleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> adminService.approveWholesale(999L, 1L));
    }

    @Test
    @DisplayName("rejectWholesale: Sets status to REJECTED and records admin rejection notes")
    void testRejectWholesale_Success() {
        when(wholesaleRepository.findById(10L)).thenReturn(Optional.of(pendingApp));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(wholesaleRepository.save(any(WholesaleApplication.class))).thenAnswer(i -> i.getArgument(0));

        WholesaleApplication result = adminService.rejectWholesale(10L, 1L, "Invalid tax license");

        assertNotNull(result);
        assertEquals(ApplicationStatus.REJECTED, result.getStatus());
        assertEquals(adminUser, result.getReviewedBy());
        assertEquals("Invalid tax license", result.getAdminNotes());
        assertEquals(CustomerType.RETAIL, customerUser.getCustomerType()); // Customer remains retail
    }

    @Test
    @DisplayName("getWholesaleApplications: Filters by status or returns all")
    void testGetWholesaleApplications() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<WholesaleApplication> page = new PageImpl<>(List.of(pendingApp));

        when(wholesaleRepository.findByStatus(ApplicationStatus.PENDING, pageable)).thenReturn(page);
        when(wholesaleRepository.findAll(pageable)).thenReturn(page);

        Page<WholesaleApplication> filtered = adminService.getWholesaleApplications("PENDING", pageable);
        assertEquals(1, filtered.getContent().size());

        Page<WholesaleApplication> all = adminService.getWholesaleApplications(null, pageable);
        assertEquals(1, all.getContent().size());
    }

    @Test
    @DisplayName("toggleUserActive: Inverts active flag between true and false")
    void testToggleUserActive() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User deactivated = adminService.toggleUserActive(2L);
        assertFalse(deactivated.getIsActive());

        User reactivated = adminService.toggleUserActive(2L);
        assertTrue(reactivated.getIsActive());
    }

    @Test
    @DisplayName("changeUserRole: Reassigns user role to specified target role")
    void testChangeUserRole() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(roleRepository.findByName("CASHIER")).thenReturn(Optional.of(cashierRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User updated = adminService.changeUserRole(2L, "CASHIER");
        assertEquals("CASHIER", updated.getRole().getName());
        verify(userRepository).save(customerUser);
    }

    @Test
    @DisplayName("createUser: Registers new user with encrypted password and specified role")
    void testCreateUser() {
        when(userRepository.findByEmail("new@retail.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(99L);
            return u;
        });

        AdminService.CreateUserRequest req = new AdminService.CreateUserRequest(
                "New Customer", "new@retail.com", "pass123", "555-1234", "USER", "RETAIL"
        );
        User created = adminService.createUser(req);
        assertNotNull(created);
        assertEquals("new@retail.com", created.getEmail());
        assertEquals("New Customer", created.getFullName());
        assertTrue(created.getIsActive());
    }

    @Test
    @DisplayName("updateUser: Modifies user details, role, and active status")
    void testUpdateUser() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        AdminService.UpdateUserRequest req = new AdminService.UpdateUserRequest(
                "Jane Updated", "jane.updated@retail.com", "555-9999", "ADMIN", "WHOLESALE", true, null
        );
        User updated = adminService.updateUser(2L, req);
        assertEquals("Jane Updated", updated.getFullName());
        assertEquals("jane.updated@retail.com", updated.getEmail());
        assertEquals("ADMIN", updated.getRole().getName());
        assertEquals(CustomerType.WHOLESALE, updated.getCustomerType());
    }

    @Test
    @DisplayName("deleteUser: Deletes user entity from repository")
    void testDeleteUser() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        doNothing().when(userRepository).delete(customerUser);

        adminService.deleteUser(2L);
        verify(userRepository).delete(customerUser);
    }

    @Test
    @DisplayName("getDashboardSummary: Accurately calculates gross, online, and POS KPIs")
    void testGetDashboardSummary() {
        when(orderRepository.calculateGrossRevenue()).thenReturn(new BigDecimal("15000.00"));
        when(orderRepository.calculateRevenueByChannel(OrderChannel.ONLINE)).thenReturn(new BigDecimal("9000.00"));
        when(orderRepository.calculateRevenueByChannel(OrderChannel.POS)).thenReturn(new BigDecimal("6000.00"));
        when(orderRepository.countByChannel(OrderChannel.ONLINE)).thenReturn(120L);
        when(orderRepository.countByChannel(OrderChannel.POS)).thenReturn(80L);
        when(wholesaleRepository.countByStatus(ApplicationStatus.PENDING)).thenReturn(4L);
        when(batchRepository.countByIsExpiredTrue()).thenReturn(2L);

        Product p = Product.builder().id(1L).name("Low stock item").build();
        when(inventoryService.getLowStockAlerts()).thenReturn(List.of(p));

        AdminService.ExecutiveKpiSummary kpi = adminService.getDashboardSummary();

        assertNotNull(kpi);
        assertEquals(new BigDecimal("15000.00"), kpi.totalGrossRevenue());
        assertEquals(new BigDecimal("9000.00"), kpi.onlineRevenue());
        assertEquals(new BigDecimal("6000.00"), kpi.posRevenue());
        assertEquals(120L, kpi.onlineOrdersCount());
        assertEquals(80L, kpi.posOrdersCount());
        assertEquals(4L, kpi.pendingWholesaleApplicationsCount());
        assertEquals(2L, kpi.expiredBatchesCount());
        assertEquals(1, kpi.lowStockProductsCount());
    }

    @Test
    @DisplayName("getSalesSeries: Generates daily time series for 7 days")
    void testGetSalesSeries() {
        Order onlineOrder = Order.builder()
                .channel(OrderChannel.ONLINE)
                .totalAmount(new BigDecimal("100.00"))
                .status(OrderStatus.PAID)
                .build();
        onlineOrder.setCreatedAt(LocalDateTime.now());

        Order posOrder = Order.builder()
                .channel(OrderChannel.POS)
                .totalAmount(new BigDecimal("50.00"))
                .status(OrderStatus.PAID)
                .build();
        posOrder.setCreatedAt(LocalDateTime.now());

        when(orderRepository.findAll()).thenReturn(List.of(onlineOrder, posOrder));

        List<AdminService.SalesSeriesPointDto> series = adminService.getSalesSeries(7);

        assertNotNull(series);
        assertEquals(7, series.size());
        // Today is the last point
        AdminService.SalesSeriesPointDto today = series.get(6);
        assertEquals(new BigDecimal("100.00"), today.onlineRevenue());
        assertEquals(new BigDecimal("50.00"), today.posRevenue());
        assertEquals(new BigDecimal("150.00"), today.totalRevenue());
        assertEquals(2L, today.orderCount());
    }

    @Test
    @DisplayName("getAuditLogs: Filters by transaction type and date range")
    void testGetAuditLogs() {
        Pageable pageable = PageRequest.of(0, 10);
        InventoryTransaction tx = InventoryTransaction.builder()
                .id(1L)
                .type(TransactionType.STOCK_IN)
                .quantityDelta(50)
                .build();
        Page<InventoryTransaction> page = new PageImpl<>(List.of(tx));

        when(transactionRepository.findByType(TransactionType.STOCK_IN, pageable)).thenReturn(page);
        when(transactionRepository.findAll(pageable)).thenReturn(page);

        Page<InventoryTransaction> filtered = adminService.getAuditLogs("STOCK_IN", null, null, pageable);
        assertEquals(1, filtered.getContent().size());

        Page<InventoryTransaction> all = adminService.getAuditLogs(pageable);
        assertEquals(1, all.getContent().size());
    }

    @Test
    @DisplayName("getAllProducts: Retrieves all products with margin and batch calculations")
    void testGetAllProducts() {
        Product product = new Product(1L, null, "SKU-TEST", "Test Product", "Description",
                "http://img.jpg", new BigDecimal("10.00"), new BigDecimal("20.00"),
                new BigDecimal("15.00"), 5, false, false, LocalDateTime.now(), LocalDateTime.now());

        when(productRepository.findByIsDeletedFalseOrderByNameAsc()).thenReturn(List.of(product));
        when(batchAllocationService.getAvailableStock(1L)).thenReturn(40);
        when(batchAllocationService.getCurrentBatchInfo(1L)).thenReturn(Optional.empty());
        when(batchRepository.findByProduct_IdOrderByReceivedAtDesc(1L)).thenReturn(List.of());

        List<AdminService.AdminProductDetailDto> result = adminService.getAllProducts();

        assertNotNull(result);
        assertEquals(1, result.size());
        AdminService.AdminProductDetailDto dto = result.get(0);
        assertEquals("SKU-TEST", dto.sku());
        assertEquals(40, dto.availableStock());
        assertEquals(new BigDecimal("50.0"), dto.retailMarginPercent());
        assertEquals(new BigDecimal("33.3"), dto.wholesaleMarginPercent());
    }

    @Test
    @DisplayName("getProductDetail: Returns product detail or throws 404")
    void testGetProductDetail() {
        Product product = new Product(1L, null, "SKU-TEST", "Test Product", "Description",
                "http://img.jpg", new BigDecimal("10.00"), new BigDecimal("20.00"),
                new BigDecimal("15.00"), 5, false, false, LocalDateTime.now(), LocalDateTime.now());

        when(productRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(product));
        when(batchAllocationService.getAvailableStock(any())).thenReturn(25);
        when(batchAllocationService.getCurrentBatchInfo(any())).thenReturn(Optional.empty());
        when(batchRepository.findByProduct_IdOrderByReceivedAtDesc(any())).thenReturn(List.of());

        AdminService.AdminProductDetailDto dto = adminService.getProductDetail(1L);
        assertNotNull(dto);
        assertEquals("SKU-TEST", dto.sku());
        assertEquals(25, dto.availableStock());

        when(productRepository.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> adminService.getProductDetail(999L));
    }

    @Test
    @DisplayName("getAllPayments & getPaymentDetail: Returns payment dtos")
    void testPayments() {
        User customer = User.builder()
                .id(10L)
                .email("cust@test.com")
                .fullName("Customer One")
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();
        User cashier = User.builder()
                .id(11L)
                .email("cashier@test.com")
                .fullName("Cashier One")
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();

        Order order = new Order(1L, "ORD-101", OrderChannel.POS, customer, cashier, "Floor",
                OrderStatus.PAID, PaymentMethod.CARD, CustomerType.RETAIL,
                new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("110.00"),
                List.of(), LocalDateTime.now());

        when(orderRepository.findAll()).thenReturn(List.of(order));
        when(orderRepository.findByOrderNumber("ORD-101")).thenReturn(Optional.of(order));

        List<AdminService.AdminPaymentDto> payments = adminService.getAllPayments("POS", "CARD", "PAID");
        assertNotNull(payments);
        assertEquals(1, payments.size());
        assertEquals("ORD-101", payments.get(0).orderNumber());
        assertEquals("Customer One", payments.get(0).customerName());
        assertEquals("Cashier One", payments.get(0).cashierName());
        assertEquals("WALK_IN", payments.get(0).customerCategory());

        List<AdminService.CustomerSpendingSummaryDto> spending = adminService.getCustomerSpendingSummary("ALL");
        assertNotNull(spending);
        assertEquals(1, spending.size());
        assertEquals("Customer One", spending.get(0).customerName());
        assertEquals(new BigDecimal("110.00"), spending.get(0).totalSpending());

        AdminService.AdminPaymentDto detail = adminService.getPaymentDetail("ORD-101");
        assertNotNull(detail);
        assertEquals("ORD-101", detail.orderNumber());

        when(orderRepository.findByOrderNumber("ORD-NONEXIST")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> adminService.getPaymentDetail("ORD-NONEXIST"));
    }

    @Test
    @DisplayName("getFinancialTaxReport & generateFinancialTaxCsv: Aggregates revenue and tax accurately")
    void testFinancialTaxReportAndCsv() {
        User customer = User.builder()
                .id(10L)
                .email("cust@test.com")
                .fullName("Customer One")
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();

        Order posOrder = new Order(1L, "ORD-POS-1", OrderChannel.POS, customer, null, "Store",
                OrderStatus.PAID, PaymentMethod.CARD, CustomerType.RETAIL,
                new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("110.00"),
                List.of(), LocalDateTime.now());

        Order onlineOrder = new Order(2L, "ORD-ONL-1", OrderChannel.ONLINE, customer, null, "123 St",
                OrderStatus.PAID, PaymentMethod.BANK_TRANSFER, CustomerType.RETAIL,
                new BigDecimal("200.00"), new BigDecimal("20.00"), new BigDecimal("220.00"),
                List.of(), LocalDateTime.now());

        when(orderRepository.findAll()).thenReturn(List.of(posOrder, onlineOrder));

        AdminService.FinancialTaxReportDto report = adminService.getFinancialTaxReport();
        assertNotNull(report);
        assertEquals(new BigDecimal("330.00"), report.totalGrossRevenue());
        assertEquals(new BigDecimal("30.00"), report.totalTaxCollected());
        assertEquals(new BigDecimal("300.00"), report.totalNetRevenue());
        assertEquals(new BigDecimal("110.00"), report.posGrossRevenue());
        assertEquals(new BigDecimal("220.00"), report.onlineGrossRevenue());
        assertEquals(new BigDecimal("110.00"), report.cardTotal());
        assertEquals(new BigDecimal("220.00"), report.bankTransferTotal());
        assertEquals(2, report.totalOrdersCount());

        String csv = adminService.generateFinancialTaxCsv();
        assertNotNull(csv);
        assertTrue(csv.contains("Order Number,Date,Channel,Payment Method"));
        assertTrue(csv.contains("ORD-POS-1"));
        assertTrue(csv.contains("ORD-ONL-1"));
    }
}

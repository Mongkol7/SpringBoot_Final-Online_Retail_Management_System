package com.retail.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.service.AdminService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @MockBean
    private com.retail.store.security.jwt.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.retail.store.security.user.CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("GET /admin/dashboard/summary: Returns 200 with Executive KPI summary")
    void testGetDashboardSummary() throws Exception {
        AdminService.ExecutiveKpiSummary kpi = new AdminService.ExecutiveKpiSummary(
                new BigDecimal("25000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("10000.00"),
                150,
                100,
                5,
                1,
                2
        );

        when(adminService.getDashboardSummary()).thenReturn(kpi);

        mockMvc.perform(get("/admin/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGrossRevenue").value(25000.00))
                .andExpect(jsonPath("$.onlineRevenue").value(15000.00))
                .andExpect(jsonPath("$.posRevenue").value(10000.00))
                .andExpect(jsonPath("$.onlineOrdersCount").value(150))
                .andExpect(jsonPath("$.posOrdersCount").value(100))
                .andExpect(jsonPath("$.pendingWholesaleApplicationsCount").value(5))
                .andExpect(jsonPath("$.expiredBatchesCount").value(1))
                .andExpect(jsonPath("$.lowStockProductsCount").value(2));
    }

    @Test
    @DisplayName("GET /admin/dashboard/sales-series: Returns 200 with time series array")
    void testGetSalesSeries() throws Exception {
        AdminService.SalesSeriesPointDto pt = new AdminService.SalesSeriesPointDto(
                "2026-10-21",
                new BigDecimal("500.00"),
                new BigDecimal("300.00"),
                new BigDecimal("800.00"),
                10
        );

        when(adminService.getSalesSeries(7)).thenReturn(List.of(pt));

        mockMvc.perform(get("/admin/dashboard/sales-series?days=7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-10-21"))
                .andExpect(jsonPath("$[0].totalRevenue").value(800.00));
    }

    @Test
    @DisplayName("GET /admin/wholesale/applications: Returns 200 with paginated applications")
    void testGetWholesaleApplications() throws Exception {
        WholesaleApplication app = WholesaleApplication.builder()
                .id(1L)
                .businessName("Global Traders")
                .taxIdOrLicense("TAX-12345")
                .status(ApplicationStatus.PENDING)
                .build();

        when(adminService.getWholesaleApplications(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(app)));

        mockMvc.perform(get("/admin/wholesale/applications?status=PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].businessName").value("Global Traders"));
    }

    @Test
    @DisplayName("POST /admin/wholesale/applications/{id}/approve: Returns 200 with approved application")
    void testApproveWholesale() throws Exception {
        WholesaleApplication app = WholesaleApplication.builder()
                .id(1L)
                .status(ApplicationStatus.APPROVED)
                .build();

        when(adminService.approveWholesale(eq(1L), any())).thenReturn(app);

        mockMvc.perform(post("/admin/wholesale/applications/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /admin/wholesale/applications/{id}/reject: Returns 200 with rejected application")
    void testRejectWholesale() throws Exception {
        WholesaleApplication app = WholesaleApplication.builder()
                .id(1L)
                .status(ApplicationStatus.REJECTED)
                .adminNotes("Docs missing")
                .build();

        when(adminService.rejectWholesale(eq(1L), any(), any())).thenReturn(app);

        mockMvc.perform(post("/admin/wholesale/applications/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Docs missing\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.adminNotes").value("Docs missing"));
    }

    @Test
    @DisplayName("GET /admin/users: Returns 200 with user list")
    void testGetUsers() throws Exception {
        User u = User.builder()
                .id(1L)
                .email("user@test.com")
                .fullName("Test User")
                .role(new Role(2, "USER"))
                .isActive(true)
                .build();

        when(adminService.getAllUsers(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(u)));

        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("user@test.com"));
    }

    @Test
    @DisplayName("PATCH /admin/users/{id}/toggle-active: Returns 200 with toggled user status")
    void testToggleUserActive() throws Exception {
        User u = User.builder()
                .id(2L)
                .email("locked@test.com")
                .fullName("Locked User")
                .role(new Role(2, "USER"))
                .isActive(false)
                .build();

        when(adminService.toggleUserActive(2L)).thenReturn(u);

        mockMvc.perform(patch("/admin/users/2/toggle-active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("PATCH /admin/users/{id}/change-role: Returns 200 with updated role")
    void testChangeUserRole() throws Exception {
        User u = User.builder()
                .id(2L)
                .email("promoted@test.com")
                .role(new Role(3, "CASHIER"))
                .build();

        when(adminService.changeUserRole(eq(2L), eq("CASHIER"))).thenReturn(u);

        mockMvc.perform(patch("/admin/users/2/change-role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roleName\":\"CASHIER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role.name").value("CASHIER"));
    }

    @Test
    @DisplayName("POST /admin/users: Returns 201 when new user created")
    void testCreateUser() throws Exception {
        User u = User.builder()
                .id(10L)
                .email("created@test.com")
                .fullName("Created User")
                .role(new Role(4, "USER"))
                .isActive(true)
                .build();

        when(adminService.createUser(any())).thenReturn(u);

        mockMvc.perform(post("/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Created User\",\"email\":\"created@test.com\",\"password\":\"p123\",\"roleName\":\"USER\",\"customerType\":\"RETAIL\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("created@test.com"))
                .andExpect(jsonPath("$.fullName").value("Created User"));
    }

    @Test
    @DisplayName("PUT /admin/users/{id}: Returns 200 when user updated")
    void testUpdateUser() throws Exception {
        User u = User.builder()
                .id(10L)
                .email("updated@test.com")
                .fullName("Updated User")
                .role(new Role(1, "ADMIN"))
                .isActive(true)
                .build();

        when(adminService.updateUser(eq(10L), any())).thenReturn(u);

        mockMvc.perform(put("/admin/users/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Updated User\",\"email\":\"updated@test.com\",\"roleName\":\"ADMIN\",\"isActive\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated User"))
                .andExpect(jsonPath("$.role.name").value("ADMIN"));
    }

    @Test
    @DisplayName("DELETE /admin/users/{id}: Returns 204 No Content")
    void testDeleteUser() throws Exception {
        doNothing().when(adminService).deleteUser(10L);

        mockMvc.perform(delete("/admin/users/10"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /admin/audit-logs: Returns 200 with audit entries")
    void testGetAuditLogs() throws Exception {
        InventoryTransaction tx = InventoryTransaction.builder()
                .id(1L)
                .type(TransactionType.STOCK_IN)
                .quantityDelta(100)
                .build();

        when(adminService.getAuditLogs(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(tx)));

        mockMvc.perform(get("/admin/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].type").value("STOCK_IN"));
    }

    @Test
    @DisplayName("GET /admin/products: Returns 200 with all products and margin details")
    void testGetAdminProducts() throws Exception {
        AdminService.AdminProductDetailDto dto = new AdminService.AdminProductDetailDto(
                1L, "SKU-PROD-01", "Artisan Coffee", "Description", "Beverages",
                "http://img.jpg", new BigDecimal("2.00"), new BigDecimal("5.00"),
                new BigDecimal("3.50"), new BigDecimal("60.0"), new BigDecimal("42.9"),
                45, 10, true, "BATCH-01", java.time.LocalDate.of(2027, 10, 1), List.of()
        );

        when(adminService.getAllProducts()).thenReturn(List.of(dto));

        mockMvc.perform(get("/admin/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sku").value("SKU-PROD-01"))
                .andExpect(jsonPath("$[0].retailMarginPercent").value(60.0))
                .andExpect(jsonPath("$[0].availableStock").value(45));
    }

    @Test
    @DisplayName("GET /admin/products/{id}: Returns 200 with specific product detail")
    void testGetAdminProductDetail() throws Exception {
        AdminService.AdminProductDetailDto dto = new AdminService.AdminProductDetailDto(
                1L, "SKU-PROD-01", "Artisan Coffee", "Description", "Beverages",
                "http://img.jpg", new BigDecimal("2.00"), new BigDecimal("5.00"),
                new BigDecimal("3.50"), new BigDecimal("60.0"), new BigDecimal("42.9"),
                45, 10, true, "BATCH-01", java.time.LocalDate.of(2027, 10, 1), List.of()
        );

        when(adminService.getProductDetail(1L)).thenReturn(dto);

        mockMvc.perform(get("/admin/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Artisan Coffee"))
                .andExpect(jsonPath("$.currentBatchCode").value("BATCH-01"));
    }

    @Test
    @DisplayName("GET /admin/payments: Returns 200 with payment transactions")
    void testGetAdminPayments() throws Exception {
        AdminService.AdminPaymentDto payment = new AdminService.AdminPaymentDto(
                1L, "ORD-20261021-001", "POS", "CARD", "PAID", "RETAIL",
                "Alice", "alice@example.com", "John Cashier", 2,
                new BigDecimal("20.00"), new BigDecimal("2.00"), new BigDecimal("22.00"),
                java.time.LocalDateTime.now(), List.of()
        );

        when(adminService.getAllPayments(any(), any(), any(), any())).thenReturn(List.of(payment));

        mockMvc.perform(get("/admin/payments?channel=POS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderNumber").value("ORD-20261021-001"))
                .andExpect(jsonPath("$[0].channel").value("POS"))
                .andExpect(jsonPath("$[0].paymentMethod").value("CARD"));
    }

    @Test
    @DisplayName("GET /admin/payments/customer-spending: Returns 200 with customer grouped spending analytics")
    void testGetCustomerSpending() throws Exception {
        AdminService.CustomerSpendingSummaryDto spending = new AdminService.CustomerSpendingSummaryDto(
                "Alice", "alice@example.com", "WALK_IN", "RETAIL", 2, 5,
                new BigDecimal("100.00"), new BigDecimal("90.00"), new BigDecimal("10.00"),
                new BigDecimal("50.00"), java.time.LocalDateTime.now(), List.of()
        );

        when(adminService.getCustomerSpendingSummary(any())).thenReturn(List.of(spending));

        mockMvc.perform(get("/admin/payments/customer-spending?customerCategory=ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerName").value("Alice"))
                .andExpect(jsonPath("$[0].totalSpending").value(100.00))
                .andExpect(jsonPath("$[0].totalOrders").value(2));
    }

    @Test
    @DisplayName("GET /admin/payments/{orderNumber}: Returns 200 with payment and receipt detail")
    void testGetPaymentDetail() throws Exception {
        AdminService.AdminPaymentDto payment = new AdminService.AdminPaymentDto(
                1L, "ORD-20261021-001", "POS", "CARD", "PAID", "RETAIL",
                "Alice", "alice@example.com", "John Cashier", 1,
                new BigDecimal("20.00"), new BigDecimal("2.00"), new BigDecimal("22.00"),
                java.time.LocalDateTime.now(),
                List.of(new AdminService.AdminPaymentItemDto(10L, "Coffee", "SKU-001", 1, new BigDecimal("20.00"), new BigDecimal("20.00")))
        );

        when(adminService.getPaymentDetail("ORD-20261021-001")).thenReturn(payment);

        mockMvc.perform(get("/admin/payments/ORD-20261021-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-20261021-001"))
                .andExpect(jsonPath("$.items[0].productName").value("Coffee"));
    }

    @Test
    @DisplayName("GET /admin/reports/financial-tax: Returns 200 with tax and revenue metrics")
    void testGetFinancialTaxReport() throws Exception {
        AdminService.FinancialTaxReportDto report = new AdminService.FinancialTaxReportDto(
                new BigDecimal("110.00"), new BigDecimal("10.00"), new BigDecimal("100.00"),
                new BigDecimal("55.00"), new BigDecimal("5.00"),
                new BigDecimal("55.00"), new BigDecimal("5.00"),
                new BigDecimal("60.00"), new BigDecimal("50.00"), BigDecimal.ZERO,
                2, 1, 1, java.time.LocalDateTime.now()
        );

        when(adminService.getFinancialTaxReport()).thenReturn(report);

        mockMvc.perform(get("/admin/reports/financial-tax"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalGrossRevenue").value(110.00))
                .andExpect(jsonPath("$.totalTaxCollected").value(10.00));
    }

    @Test
    @DisplayName("GET /admin/reports/financial-tax/csv: Returns 200 with text/csv attachment")
    void testExportFinancialTaxCsv() throws Exception {
        when(adminService.generateFinancialTaxCsv()).thenReturn("Order Number,Channel,Total Amount\nORD-1,POS,22.00");

        mockMvc.perform(get("/admin/reports/financial-tax/csv"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentTypeCompatibleWith(MediaType.valueOf("text/csv")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"financial_tax_report.csv\""));
    }
}

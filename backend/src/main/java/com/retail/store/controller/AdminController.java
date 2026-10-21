package com.retail.store.controller;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping({"/dashboard/summary", "/dashboard/kpi-summary"})
    public ResponseEntity<AdminService.ExecutiveKpiSummary> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/dashboard/sales-series")
    public ResponseEntity<List<AdminService.SalesSeriesPointDto>> getSalesSeries(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(adminService.getSalesSeries(days));
    }

    @GetMapping({"/wholesale/applications", "/wholesale-applications"})
    public ResponseEntity<Page<WholesaleApplication>> getWholesaleApplications(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.getWholesaleApplications(status, PageRequest.of(page, size)));
    }

    @PostMapping({"/wholesale/applications/{id}/approve", "/wholesale-applications/{id}/approve"})
    public ResponseEntity<WholesaleApplication> approveWholesale(
            @AuthenticationPrincipal UserDetailsImpl admin,
            @PathVariable Long id) {
        Long adminId = admin != null ? admin.getId() : 1L;
        return ResponseEntity.ok(adminService.approveWholesale(id, adminId));
    }

    @PostMapping({"/wholesale/applications/{id}/reject", "/wholesale-applications/{id}/reject"})
    public ResponseEntity<WholesaleApplication> rejectWholesale(
            @AuthenticationPrincipal UserDetailsImpl admin,
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequest request) {
        Long adminId = admin != null ? admin.getId() : 1L;
        String reason = (request != null && request.reason() != null) ? request.reason() : "Application criteria not met";
        return ResponseEntity.ok(adminService.rejectWholesale(id, adminId, reason));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(PageRequest.of(page, size)));
    }

    @PatchMapping("/users/{id}/toggle-active")
    public ResponseEntity<User> toggleUserActive(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserActive(id));
    }

    @PatchMapping("/users/{id}/change-role")
    public ResponseEntity<User> changeUserRole(@PathVariable Long id, @RequestBody ChangeRoleRequest request) {
        return ResponseEntity.ok(adminService.changeUserRole(id, request.roleName()));
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody AdminService.CreateUserRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(adminService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody AdminService.UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/audit-logs", "/audit/inventory-transactions"})
    public ResponseEntity<Page<InventoryTransaction>> getAuditLogs(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(type, start, end, PageRequest.of(page, size)));
    }

    @GetMapping("/products")
    public ResponseEntity<List<AdminService.AdminProductDetailDto>> getAllProducts() {
        return ResponseEntity.ok(adminService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<AdminService.AdminProductDetailDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getProductDetail(id));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<AdminService.AdminPaymentDto>> getAllPayments(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerCategory) {
        return ResponseEntity.ok(adminService.getAllPayments(channel, paymentMethod, status, customerCategory));
    }

    @GetMapping("/payments/customer-spending")
    public ResponseEntity<List<AdminService.CustomerSpendingSummaryDto>> getCustomerSpending(
            @RequestParam(required = false, defaultValue = "ALL") String customerCategory) {
        return ResponseEntity.ok(adminService.getCustomerSpendingSummary(customerCategory));
    }

    @GetMapping("/payments/{orderNumber}")
    public ResponseEntity<AdminService.AdminPaymentDto> getPaymentDetail(@PathVariable String orderNumber) {
        return ResponseEntity.ok(adminService.getPaymentDetail(orderNumber));
    }

    @GetMapping("/reports/financial-tax")
    public ResponseEntity<AdminService.FinancialTaxReportDto> getFinancialTaxReport() {
        return ResponseEntity.ok(adminService.getFinancialTaxReport());
    }

    @GetMapping(value = "/reports/financial-tax/csv", produces = "text/csv")
    public ResponseEntity<String> exportFinancialTaxCsv() {
        String csv = adminService.generateFinancialTaxCsv();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"financial_tax_report.csv\"")
                .body(csv);
    }

    public record RejectRequest(String reason) {}
    public record ChangeRoleRequest(String roleName) {}
}

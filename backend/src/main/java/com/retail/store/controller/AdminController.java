package com.retail.store.controller;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<AdminService.ExecutiveKpiSummary> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/wholesale/applications")
    public ResponseEntity<Page<WholesaleApplication>> getWholesaleApplications(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.getWholesaleApplications(status, PageRequest.of(page, size)));
    }

    @PostMapping("/wholesale/applications/{id}/approve")
    public ResponseEntity<WholesaleApplication> approveWholesale(
            @AuthenticationPrincipal UserDetailsImpl admin,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveWholesale(id, admin.getId()));
    }

    @PostMapping("/wholesale/applications/{id}/reject")
    public ResponseEntity<WholesaleApplication> rejectWholesale(
            @AuthenticationPrincipal UserDetailsImpl admin,
            @PathVariable Long id,
            @RequestBody RejectRequest request) {
        return ResponseEntity.ok(adminService.rejectWholesale(id, admin.getId(), request.reason()));
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

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<InventoryTransaction>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(PageRequest.of(page, size)));
    }

    public record RejectRequest(String reason) {}
    public record ChangeRoleRequest(String roleName) {}
}

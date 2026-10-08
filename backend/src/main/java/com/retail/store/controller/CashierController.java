package com.retail.store.controller;

import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.exception.BadRequestException;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.AuthService;
import com.retail.store.service.CashierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping({"/pos", "/api/v1/pos", "/cashier", "/api/v1/cashier"})
public class CashierController {

    private final CashierService cashierService;

    public CashierController(CashierService cashierService) {
        this.cashierService = cashierService;
    }

    /**
     * Task 2.1: Cashier Staff Login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@RequestBody CashierLoginRequest request) {
        AuthService.AuthResponse response = cashierService.login(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    /**
     * Task 2.2: Walk-In POS Checkout Pipeline
     * Enforces STRICT RETAIL PRICING lock and triggers FIFO/FEFO inventory batch deduction.
     */
    @PostMapping("/checkout")
    public ResponseEntity<CashierService.PosCheckoutResult> checkoutWalkIn(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestBody PosWalkInRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());
        CashierService.PosCheckoutResult result = cashierService.checkoutWalkIn(
                cashierId,
                request.customerId(),
                request.items(),
                request.amountTendered(),
                request.paymentMethod()
        );
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    /**
     * Task 2.3: 80mm Thermal Monochromatic Receipt Generator
     */
    @GetMapping("/receipts/{orderNumber}")
    public ResponseEntity<CashierService.ThermalReceiptDto> getReceipt(@PathVariable String orderNumber) {
        return ResponseEntity.ok(cashierService.getReceipt(orderNumber));
    }

    /**
     * Task 2.4: Cashier Shift Opening with Opening Float
     */
    @PostMapping("/shift/open")
    public ResponseEntity<CashierService.PosShiftDto> openShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestBody OpenShiftRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());
        CashierService.PosShiftDto shift = cashierService.openShift(
                cashierId,
                request.openingFloat(),
                request.notes()
        );
        return new ResponseEntity<>(shift, HttpStatus.CREATED);
    }

    /**
     * Task 2.4: Cashier Shift Drawer Reconciliation & Variance Calculation
     */
    @PostMapping("/shift/close")
    public ResponseEntity<CashierService.PosShiftDto> closeShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestBody CloseShiftRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());
        CashierService.PosShiftDto shift = cashierService.closeShift(
                cashierId,
                request.closingCash(),
                request.notes()
        );
        return ResponseEntity.ok(shift);
    }

    /**
     * Task 2.4: Current Shift Real-Time Statistics
     */
    @GetMapping("/shift/current")
    public ResponseEntity<CashierService.PosShiftDto> getCurrentShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestParam(required = false) Long cashierId) {
        Long targetId = resolveCashierId(cashier, cashierId);
        return ResponseEntity.ok(cashierService.getCurrentShift(targetId));
    }

    /**
     * Fast Barcode / SKU Product Lookup for POS scanning
     */
    @GetMapping("/products/scan/{sku}")
    public ResponseEntity<CashierService.PosProductScanDto> scanProduct(@PathVariable String sku) {
        return ResponseEntity.ok(cashierService.scanProduct(sku));
    }

    private Long resolveCashierId(UserDetailsImpl cashier, Long explicitId) {
        if (cashier != null && cashier.getId() != null) {
            return cashier.getId();
        }
        if (explicitId != null) {
            return explicitId;
        }
        throw new BadRequestException("Cashier identity must be authenticated or provided.");
    }

    public record CashierLoginRequest(String email, String password) {}

    public record PosWalkInRequest(
            Long cashierId,
            Long customerId,
            List<CashierService.PosCartItemDto> items,
            BigDecimal amountTendered,
            PaymentMethod paymentMethod
    ) {}

    public record OpenShiftRequest(
            Long cashierId,
            BigDecimal openingFloat,
            String notes
    ) {}

    public record CloseShiftRequest(
            Long cashierId,
            BigDecimal closingCash,
            String notes
    ) {}
}

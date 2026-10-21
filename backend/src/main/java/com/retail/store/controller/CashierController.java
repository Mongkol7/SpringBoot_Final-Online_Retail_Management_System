package com.retail.store.controller;

import com.retail.store.dto.cashier.request.CashierLoginRequest;
import com.retail.store.dto.cashier.request.CloseShiftRequest;
import com.retail.store.dto.cashier.request.OpenShiftRequest;
import com.retail.store.dto.cashier.request.PosWalkInRequest;
import com.retail.store.dto.cashier.response.*;
import com.retail.store.exception.BadRequestException;
import com.retail.store.mapper.cashier.CashierMapper;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.CashierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/pos", "/api/v1/pos", "/cashier", "/api/v1/cashier"})
public class CashierController {

    private final CashierService cashierService;
    private final CashierMapper cashierMapper;

    public CashierController(CashierService cashierService, CashierMapper cashierMapper) {
        this.cashierService = cashierService;
        this.cashierMapper = cashierMapper;
    }

    /**
     * Task 2.1: Cashier Staff Login
     */
    @PostMapping("/login")
    public ResponseEntity<CashierLoginResponse> login(@Valid @RequestBody CashierLoginRequest request) {
        var response = cashierService.login(request.email(), request.password());
        return ResponseEntity.ok(cashierMapper.toLoginResponse(response));
    }

    /**
     * Task 2.2: Walk-In POS Checkout Pipeline
     * Enforces STRICT RETAIL PRICING lock and triggers FIFO/FEFO inventory batch deduction.
     */
    @PostMapping("/checkout")
    public ResponseEntity<PosCheckoutResponse> checkoutWalkIn(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @Valid @RequestBody PosWalkInRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());

        List<CashierService.PosCartItemDto> serviceItems = request.items() == null ? List.of() :
                request.items().stream()
                        .map(i -> new CashierService.PosCartItemDto(i.productId(), i.quantity()))
                        .toList();

        CashierService.PosCheckoutResult result = cashierService.checkoutWalkIn(
                cashierId,
                request.customerId(),
                serviceItems,
                request.amountTendered(),
                request.paymentMethod()
        );
        return new ResponseEntity<>(cashierMapper.toCheckoutResponse(result), HttpStatus.CREATED);
    }

    /**
     * Task 2.3: 80mm Thermal Monochromatic Receipt Generator
     */
    @GetMapping("/receipts/{orderNumber}")
    public ResponseEntity<ThermalReceiptResponse> getReceipt(@PathVariable String orderNumber) {
        return ResponseEntity.ok(cashierMapper.toThermalReceiptResponse(cashierService.getReceipt(orderNumber)));
    }

    /**
     * Task 2.4: Cashier Shift Opening with Opening Float
     */
    @PostMapping("/shift/open")
    public ResponseEntity<PosShiftResponse> openShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @Valid @RequestBody OpenShiftRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());
        CashierService.PosShiftDto shift = cashierService.openShift(
                cashierId,
                request.openingFloat(),
                request.notes()
        );
        return new ResponseEntity<>(cashierMapper.toShiftResponse(shift), HttpStatus.CREATED);
    }

    /**
     * Task 2.4: Cashier Shift Drawer Reconciliation & Variance Calculation
     */
    @PostMapping("/shift/close")
    public ResponseEntity<PosShiftResponse> closeShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @Valid @RequestBody CloseShiftRequest request) {
        Long cashierId = resolveCashierId(cashier, request.cashierId());
        CashierService.PosShiftDto shift = cashierService.closeShift(
                cashierId,
                request.closingCash(),
                request.notes()
        );
        return ResponseEntity.ok(cashierMapper.toShiftResponse(shift));
    }

    /**
     * Task 2.4: Current Shift Real-Time Statistics
     */
    @GetMapping("/shift/current")
    public ResponseEntity<PosShiftResponse> getCurrentShift(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestParam(required = false) Long cashierId) {
        Long targetId = resolveCashierId(cashier, cashierId);
        return ResponseEntity.ok(cashierMapper.toShiftResponse(cashierService.getCurrentShift(targetId)));
    }

    /**
     * Fast Barcode / SKU Product Lookup for POS scanning
     */
    @GetMapping("/products/scan/{sku}")
    public ResponseEntity<PosProductScanResponse> scanProduct(@PathVariable String sku) {
        return ResponseEntity.ok(cashierMapper.toProductScanResponse(cashierService.scanProduct(sku)));
    }

    /**
     * Complete POS Product Catalog with live FIFO available stock and image URLs
     */
    @GetMapping("/products")
    public ResponseEntity<List<PosProductScanResponse>> getAllProducts() {
        var products = cashierService.getAllProducts();
        return ResponseEntity.ok(products.stream().map(cashierMapper::toProductScanResponse).toList());
    }

    /**
     * Cashier POS Sales History
     * Returns transactions with breakdown for specific cashier / time period (TODAY, SHIFT, YESTERDAY, ALL)
     */
    @GetMapping("/sales")
    public ResponseEntity<List<PosSaleSummaryResponse>> getSalesHistory(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestParam(required = false) Long cashierId,
            @RequestParam(required = false, defaultValue = "TODAY") String period) {
        Long targetCashierId = cashier != null ? cashier.getId() : cashierId;
        var history = cashierService.getSalesHistory(targetCashierId, period);
        return ResponseEntity.ok(history.stream().map(cashierMapper::toSaleSummaryResponse).toList());
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
}

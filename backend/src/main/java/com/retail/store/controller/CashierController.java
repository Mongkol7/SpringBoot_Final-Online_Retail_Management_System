package com.retail.store.controller;

import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.CashierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/pos")
public class CashierController {

    private final CashierService cashierService;

    public CashierController(CashierService cashierService) {
        this.cashierService = cashierService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CashierService.PosCheckoutResult> checkoutWalkIn(
            @AuthenticationPrincipal UserDetailsImpl cashier,
            @RequestBody PosWalkInRequest request) {
        CashierService.PosCheckoutResult result = cashierService.checkoutWalkIn(
                cashier.getId(),
                request.items(),
                request.amountTendered(),
                request.paymentMethod()
        );
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/receipts/{orderNumber}")
    public ResponseEntity<CashierService.ThermalReceiptDto> getReceipt(@PathVariable String orderNumber) {
        return ResponseEntity.ok(cashierService.getReceipt(orderNumber));
    }

    public record PosWalkInRequest(
            List<CashierService.PosCartItemDto> items,
            BigDecimal amountTendered,
            PaymentMethod paymentMethod
    ) {}
}

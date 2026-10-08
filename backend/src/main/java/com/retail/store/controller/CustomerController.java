package com.retail.store.controller;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/customer")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping("/cart/items")
    public ResponseEntity<CartItem> addToCart(@AuthenticationPrincipal UserDetailsImpl user,
                                              @RequestBody AddCartItemRequest request) {
        CartItem item = customerService.addToCart(user.getId(), request.productId(), request.quantity());
        return new ResponseEntity<>(item, HttpStatus.CREATED);
    }

    @GetMapping("/cart")
    public ResponseEntity<List<CartItem>> getCart(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(customerService.getCart(user.getId()));
    }

    @GetMapping("/cart/total")
    public ResponseEntity<BigDecimal> getCartTotal(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(customerService.getCartTotal(user.getId()));
    }

    @DeleteMapping("/cart/items/{id}")
    public ResponseEntity<Void> removeFromCart(@AuthenticationPrincipal UserDetailsImpl user,
                                               @PathVariable Long id) {
        customerService.removeFromCart(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/cart")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserDetailsImpl user) {
        customerService.clearCart(user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<Order> checkout(@AuthenticationPrincipal UserDetailsImpl user,
                                          @RequestBody CheckoutRequest request) {
        Order order = customerService.checkoutOnline(user.getId(), request.shippingAddress(), request.paymentMethod());
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(customerService.getCustomerOrders(user.getId()));
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderNumber) {
        return ResponseEntity.ok(customerService.getOrderDetails(orderNumber));
    }

    @PostMapping("/orders/{orderNumber}/cancel")
    public ResponseEntity<Void> cancelOrder(@AuthenticationPrincipal UserDetailsImpl user,
                                            @PathVariable String orderNumber) {
        customerService.cancelOrder(user.getId(), orderNumber);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/wholesale-apply")
    public ResponseEntity<WholesaleApplication> applyWholesale(@AuthenticationPrincipal UserDetailsImpl user,
                                                               @RequestBody WholesaleApplyRequest request) {
        WholesaleApplication app = customerService.applyForWholesale(user.getId(), request.businessName(), request.taxId());
        return new ResponseEntity<>(app, HttpStatus.CREATED);
    }

    @GetMapping("/wholesale-status")
    public ResponseEntity<WholesaleApplication> getWholesaleStatus(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(customerService.getWholesaleStatus(user.getId()));
    }

    public record AddCartItemRequest(Long productId, int quantity) {}
    public record CheckoutRequest(String shippingAddress, PaymentMethod paymentMethod) {}
    public record WholesaleApplyRequest(String businessName, String taxId) {}
}

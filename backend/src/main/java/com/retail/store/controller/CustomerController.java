package com.retail.store.controller;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.security.user.UserDetailsImpl;
import com.retail.store.service.CustomerService;
import com.retail.store.service.OrderService;
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
    private final OrderService orderService;

    public CustomerController(CustomerService customerService, OrderService orderService) {
        this.customerService = customerService;
        this.orderService = orderService;
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

    @PostMapping({"/checkout", "/orders"})
    public ResponseEntity<Order> checkout(@AuthenticationPrincipal UserDetailsImpl user,
                                          @RequestBody CheckoutRequest request) {
        Order order;
        if (request != null && request.items() != null && !request.items().isEmpty()) {
            order = orderService.createOrder(user.getId(), request.shippingAddress(), request.paymentMethod(), request.items());
        } else {
            order = customerService.checkoutOnline(user.getId(), request != null ? request.shippingAddress() : null, request != null ? request.paymentMethod() : null);
        }
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

    @RequestMapping(value = {"/orders/{orderNumber}/cancel", "/orders/{orderNumber}"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<Void> cancelOrder(@AuthenticationPrincipal UserDetailsImpl user,
                                            @PathVariable String orderNumber) {
        customerService.cancelOrder(user.getId(), orderNumber);
        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = {"/orders/{orderNumber}/confirm", "/orders/{orderNumber}/admin-confirm"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<Order> confirmOrder(@PathVariable String orderNumber) {
        Order order = customerService.confirmOrder(orderNumber);
        if (order != null) {
            return ResponseEntity.ok(order);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping({"/wholesale-apply", "/wholesale-request"})
    public ResponseEntity<WholesaleApplication> applyWholesale(@AuthenticationPrincipal UserDetailsImpl user,
                                                               @RequestBody WholesaleApplyRequest request) {
        String businessName = request.businessName() != null ? request.businessName() : request.companyName();
        String taxId = request.taxId() != null ? request.taxId() : request.taxIdOrLicense();
        if (businessName == null) businessName = "Commercial Account";
        if (taxId == null) taxId = "TAX-PENDING";
        WholesaleApplication app = customerService.applyForWholesale(user.getId(), businessName, taxId);
        return new ResponseEntity<>(app, HttpStatus.CREATED);
    }

    @GetMapping("/wholesale-status")
    public ResponseEntity<WholesaleApplication> getWholesaleStatus(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(customerService.getWholesaleStatus(user.getId()));
    }

    @GetMapping("/products")
    public ResponseEntity<List<com.retail.store.entity.Product>> getProducts() {
        return ResponseEntity.ok(customerService.getAvailableProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<com.retail.store.entity.Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getProductById(id));
    }

    public record AddCartItemRequest(Long productId, int quantity) {}
    public record CheckoutRequest(
        String shippingAddress,
        PaymentMethod paymentMethod,
        String recipientName,
        String recipientPhone,
        List<OrderService.OrderItemRequestDto> items
    ) {
        public CheckoutRequest(String shippingAddress, PaymentMethod paymentMethod) {
            this(shippingAddress, paymentMethod, null, null, null);
        }

        public CheckoutRequest(String shippingAddress, PaymentMethod paymentMethod, String recipientName, String recipientPhone) {
            this(shippingAddress, paymentMethod, recipientName, recipientPhone, null);
        }
    }
    public record WholesaleApplyRequest(
        String businessName,
        String taxId,
        String companyName,
        String taxIdOrLicense,
        String contactDetails,
        String reason
    ) {
        public WholesaleApplyRequest(String businessName, String taxId) {
            this(businessName, taxId, businessName, taxId, null, null);
        }
    }
}

package com.retail.store.service;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.Product;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.repository.CartItemRepository;
import com.retail.store.repository.OrderItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private BatchAllocationService batchAllocationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User retailUser;
    private User wholesaleUser;
    private Product productA;
    private Product productB;

    @BeforeEach
    void setUp() {
        retailUser = User.builder()
                .id(1L)
                .email("retail@example.com")
                .fullName("Alice Retail")
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();

        wholesaleUser = User.builder()
                .id(2L)
                .email("wholesale@example.com")
                .fullName("Bob Wholesale")
                .customerType(CustomerType.WHOLESALE)
                .isActive(true)
                .build();

        productA = Product.builder()
                .id(101L)
                .sku("SKU-PROD-A")
                .name("Product A")
                .retailPrice(new BigDecimal("100.00"))
                .wholesalePrice(new BigDecimal("70.00"))
                .wholesaleMinQty(10)
                .isDeleted(false)
                .build();

        productB = Product.builder()
                .id(102L)
                .sku("SKU-PROD-B")
                .name("Product B")
                .retailPrice(new BigDecimal("50.00"))
                .wholesalePrice(new BigDecimal("35.00"))
                .wholesaleMinQty(20) // Custom MOQ of 20
                .isDeleted(false)
                .build();
    }

    // =========================================================================
    // 1. TIERED QUANTITY PRICING UNIT TESTS
    // =========================================================================

    @Test
    @DisplayName("Wholesale customer meeting default MOQ (10) gets wholesale price")
    void testCalculateUnitPrice_WholesaleCustomer_MeetsMoq_GetsWholesalePrice() {
        // Quantity = 10 (meets MOQ 10)
        BigDecimal priceAt10 = orderService.calculateUnitPrice(productA, 10, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("70.00"), priceAt10);

        // Quantity = 15 (exceeds MOQ 10)
        BigDecimal priceAt15 = orderService.calculateUnitPrice(productA, 15, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("70.00"), priceAt15);
    }

    @Test
    @DisplayName("Wholesale customer below default MOQ (<10) retains standard retail price")
    void testCalculateUnitPrice_WholesaleCustomer_BelowMoq_RetainsRetailPrice() {
        // Quantity = 9 (below MOQ 10)
        BigDecimal priceAt9 = orderService.calculateUnitPrice(productA, 9, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("100.00"), priceAt9);

        // Quantity = 1 (single unit)
        BigDecimal priceAt1 = orderService.calculateUnitPrice(productA, 1, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("100.00"), priceAt1);
    }

    @Test
    @DisplayName("Wholesale customer with custom MOQ (20) retains retail price when qty < 20 and gets wholesale when qty >= 20")
    void testCalculateUnitPrice_WholesaleCustomer_CustomMoq() {
        // Quantity = 19 (below custom MOQ 20)
        BigDecimal priceAt19 = orderService.calculateUnitPrice(productB, 19, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("50.00"), priceAt19);

        // Quantity = 20 (meets custom MOQ 20)
        BigDecimal priceAt20 = orderService.calculateUnitPrice(productB, 20, CustomerType.WHOLESALE);
        assertEquals(new BigDecimal("35.00"), priceAt20);
    }

    @Test
    @DisplayName("Retail customer with quantity < 10 pays standard retail price")
    void testCalculateUnitPrice_RetailCustomer_BelowTen_GetsRetailPrice() {
        // Quantity = 1
        BigDecimal priceAt1 = orderService.calculateUnitPrice(productA, 1, CustomerType.RETAIL);
        assertEquals(new BigDecimal("100.00"), priceAt1);

        // Quantity = 9
        BigDecimal priceAt9 = orderService.calculateUnitPrice(productA, 9, CustomerType.RETAIL);
        assertEquals(new BigDecimal("100.00"), priceAt9);
    }

    @Test
    @DisplayName("Retail customer with quantity >= 10 receives 5% bulk discount")
    void testCalculateUnitPrice_RetailCustomer_TenOrMore_GetsBulkDiscount() {
        // Retail price = 100.00 -> 5% discount = 95.00
        BigDecimal priceAt10 = orderService.calculateUnitPrice(productA, 10, CustomerType.RETAIL);
        assertEquals(new BigDecimal("95.00"), priceAt10);

        // Quantity = 50 -> 5% discount = 95.00
        BigDecimal priceAt50 = orderService.calculateUnitPrice(productA, 50, CustomerType.RETAIL);
        assertEquals(new BigDecimal("95.00"), priceAt50);

        // Product B: Retail price = 50.00 -> 5% discount = 47.50
        BigDecimal priceProdBAt10 = orderService.calculateUnitPrice(productB, 10, CustomerType.RETAIL);
        assertEquals(new BigDecimal("47.50"), priceProdBAt10);
    }

    @Test
    @DisplayName("Null customer type defaults gracefully to Retail customer pricing")
    void testCalculateUnitPrice_NullCustomerType_DefaultsToRetail() {
        BigDecimal priceAt1 = orderService.calculateUnitPrice(productA, 1, null);
        assertEquals(new BigDecimal("100.00"), priceAt1);

        BigDecimal priceAt10 = orderService.calculateUnitPrice(productA, 10, null);
        assertEquals(new BigDecimal("95.00"), priceAt10);
    }

    @Test
    @DisplayName("Null product throws IllegalArgumentException")
    void testCalculateUnitPrice_NullProduct_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                orderService.calculateUnitPrice(null, 5, CustomerType.RETAIL)
        );
    }

    // =========================================================================
    // 2. BACKEND INTEGRITY & ORDER CREATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Create order from cart for WHOLESALE customer with tiered pricing and batch allocation")
    void testCreateOrderFromCart_WholesaleCustomer_TieredPricingAndBatchAllocation() {
        // Product A: 10 units @ Wholesale ($70.00) = $700.00
        CartItem item1 = CartItem.builder().id(10L).user(wholesaleUser).product(productA).quantity(10).build();
        // Product B: 2 units @ Retail ($50.00, below MOQ 20) = $100.00
        CartItem item2 = CartItem.builder().id(11L).user(wholesaleUser).product(productB).quantity(2).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(wholesaleUser));
        when(cartItemRepository.findByUser_Id(2L)).thenReturn(List.of(item1, item2));

        when(productRepository.findByIdAndIsDeletedFalse(101L)).thenReturn(Optional.of(productA));
        when(productRepository.findByIdAndIsDeletedFalse(102L)).thenReturn(Optional.of(productB));

        when(batchAllocationService.getAvailableStock(101L)).thenReturn(50);
        when(batchAllocationService.getAvailableStock(102L)).thenReturn(50);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(999L);
            return o;
        });

        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(inv -> {
            OrderItem oi = inv.getArgument(0);
            oi.setId(888L);
            return oi;
        });

        Order createdOrder = orderService.createOrderFromCart(2L, "123 Business Rd", PaymentMethod.BANK_TRANSFER);

        assertNotNull(createdOrder);
        assertEquals(OrderChannel.ONLINE, createdOrder.getChannel());
        assertEquals(OrderStatus.PENDING, createdOrder.getStatus());
        assertEquals(CustomerType.WHOLESALE, createdOrder.getPricingTierUsed());
        assertEquals("123 Business Rd", createdOrder.getShippingAddress());
        assertEquals(PaymentMethod.BANK_TRANSFER, createdOrder.getPaymentMethod());

        // Subtotal = 700.00 + 100.00 = 800.00
        assertEquals(new BigDecimal("800.00"), createdOrder.getSubtotal());
        // Tax (7% VAT) = 800.00 * 0.07 = 56.00
        assertEquals(new BigDecimal("56.00"), createdOrder.getTaxAmount());
        // Total = 856.00
        assertEquals(new BigDecimal("856.00"), createdOrder.getTotalAmount());

        // Verify FIFO/FEFO batch allocation called for both items
        verify(batchAllocationService).allocateAndDeductBatches(eq(888L), eq(101L), eq(10), eq(2L), eq("ONLINE_SALE"));
        verify(batchAllocationService).allocateAndDeductBatches(eq(888L), eq(102L), eq(2), eq(2L), eq("ONLINE_SALE"));

        // Verify cart is cleared
        verify(cartItemRepository).deleteByUser_Id(2L);
    }

    @Test
    @DisplayName("Create order for RETAIL customer with bulk discount (>=10) and verify financial recalculation")
    void testCreateOrder_RetailCustomer_BulkDiscountAndRecalculation() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(retailUser));
        when(productRepository.findByIdAndIsDeletedFalse(101L)).thenReturn(Optional.of(productA));
        when(batchAllocationService.getAvailableStock(101L)).thenReturn(20);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(inv -> {
            OrderItem oi = inv.getArgument(0);
            oi.setId(777L);
            return oi;
        });

        List<OrderService.OrderItemRequestDto> items = List.of(
                new OrderService.OrderItemRequestDto(101L, 10)
        );

        Order order = orderService.createOrder(1L, "456 Main St", PaymentMethod.CARD, items);

        assertNotNull(order);
        assertEquals(CustomerType.RETAIL, order.getPricingTierUsed());

        // Retail price $100.00 with 5% bulk discount = $95.00
        // Subtotal = 10 * 95.00 = 950.00
        assertEquals(new BigDecimal("950.00"), order.getSubtotal());
        // Tax (7%) = 950.00 * 0.07 = 66.50
        assertEquals(new BigDecimal("66.50"), order.getTaxAmount());
        // Total = 950.00 + 66.50 = 1016.50
        assertEquals(new BigDecimal("1016.50"), order.getTotalAmount());

        // Verify FIFO/FEFO allocation
        verify(batchAllocationService).allocateAndDeductBatches(eq(777L), eq(101L), eq(10), eq(1L), eq("ONLINE_SALE"));
    }

    @Test
    @DisplayName("Create order fails when cart is empty")
    void testCreateOrderFromCart_EmptyCart_ThrowsIllegalStateException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(retailUser));
        when(cartItemRepository.findByUser_Id(1L)).thenReturn(List.of());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.createOrderFromCart(1L, "456 Main St", PaymentMethod.CARD)
        );
        assertEquals("Cannot checkout with an empty cart", ex.getMessage());
    }

    @Test
    @DisplayName("Create order fails when stock is insufficient for a line item")
    void testCreateOrder_InsufficientStock_ThrowsIllegalStateException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(retailUser));
        when(productRepository.findByIdAndIsDeletedFalse(101L)).thenReturn(Optional.of(productA));
        when(batchAllocationService.getAvailableStock(101L)).thenReturn(5); // Only 5 available

        List<OrderService.OrderItemRequestDto> items = List.of(
                new OrderService.OrderItemRequestDto(101L, 10) // Requested 10
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.createOrder(1L, "456 Main St", PaymentMethod.CARD, items)
        );
        assertTrue(ex.getMessage().contains("Insufficient stock"));
    }

    @Test
    @DisplayName("Create order fails when requested item quantity is zero or negative")
    void testCreateOrder_InvalidQuantity_ThrowsIllegalArgumentException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(retailUser));
        when(productRepository.findByIdAndIsDeletedFalse(101L)).thenReturn(Optional.of(productA));

        List<OrderService.OrderItemRequestDto> items = List.of(
                new OrderService.OrderItemRequestDto(101L, 0)
        );

        assertThrows(IllegalArgumentException.class, () ->
                orderService.createOrder(1L, "456 Main St", PaymentMethod.CARD, items)
        );
    }
}

package com.retail.store.service;

import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.PosShift;
import com.retail.store.entity.Product;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.PosShiftStatus;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.InsufficientCashTenderedException;
import com.retail.store.exception.InsufficientStockException;
import com.retail.store.repository.OrderItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.PosShiftRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.security.jwt.JwtTokenProvider;
import com.retail.store.service.impl.CashierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CashierServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private PosShiftRepository posShiftRepository;

    @Mock
    private BatchAllocationService batchAllocationService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private CashierServiceImpl cashierService;

    private User cashierUser;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        Role cashierRole = new Role(2, "CASHIER");
        cashierUser = User.builder()
                .id(10L)
                .email("cashier@retailstore.com")
                .fullName("Jane Doe")
                .role(cashierRole)
                .isActive(true)
                .build();

        sampleProduct = Product.builder()
                .id(100L)
                .sku("SKU-ENERGY-BAR")
                .name("Organic Energy Bar")
                .costPrice(new BigDecimal("10.00"))
                .wholesalePrice(new BigDecimal("14.00")) // wholesale price MUST be ignored at POS
                .retailPrice(new BigDecimal("20.00"))    // retail price MUST be used
                .isPerishable(true)
                .isDeleted(false)
                .build();
    }

    @Test
    @DisplayName("POS Checkout: Strictly enforces retail price, calculates 7% tax, and calculates change")
    void testCheckoutWalkIn_SuccessWithRetailPriceAndChange() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(cashierUser));
        when(productRepository.findByIdAndIsDeletedFalse(100L)).thenReturn(Optional.of(sampleProduct));
        when(batchAllocationService.getAvailableStock(100L)).thenReturn(50);

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> {
            OrderItem item = invocation.getArgument(0);
            item.setId(555L);
            return item;
        });

        // 2 items @ $20.00 = $40.00 subtotal, $2.80 tax (7%), $42.80 total
        List<CashierService.PosCartItemDto> items = List.of(
                new CashierService.PosCartItemDto(100L, 2)
        );
        BigDecimal amountTendered = new BigDecimal("50.00");

        CashierService.PosCheckoutResult result = cashierService.checkoutWalkIn(
                10L, items, amountTendered, PaymentMethod.CASH
        );

        assertNotNull(result);
        Order order = result.order();
        assertEquals(OrderChannel.POS, order.getChannel());
        assertEquals(CustomerType.RETAIL, order.getPricingTierUsed());
        assertEquals(new BigDecimal("40.00"), order.getSubtotal());
        assertEquals(new BigDecimal("2.80"), order.getTaxAmount());
        assertEquals(new BigDecimal("42.80"), order.getTotalAmount());
        assertEquals(new BigDecimal("50.00"), result.amountTendered());
        assertEquals(new BigDecimal("7.20"), result.changeDue());

        // Verifies FIFO/FEFO inventory deduction called with POS_SALE
        verify(batchAllocationService).allocateAndDeductBatches(
                eq(555L), eq(100L), eq(2), eq(10L), eq(TransactionType.POS_SALE.name())
        );
    }

    @Test
    @DisplayName("POS Checkout: Throws InsufficientCashTenderedException when cash is less than total")
    void testCheckoutWalkIn_InsufficientCash_ThrowsException() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(cashierUser));
        when(productRepository.findByIdAndIsDeletedFalse(100L)).thenReturn(Optional.of(sampleProduct));
        when(batchAllocationService.getAvailableStock(100L)).thenReturn(50);

        List<CashierService.PosCartItemDto> items = List.of(
                new CashierService.PosCartItemDto(100L, 2)
        );
        // Total is $42.80, customer gives $30.00
        BigDecimal tendered = new BigDecimal("30.00");

        assertThrows(InsufficientCashTenderedException.class, () ->
                cashierService.checkoutWalkIn(10L, items, tendered, PaymentMethod.CASH)
        );
    }

    @Test
    @DisplayName("POS Checkout: Throws InsufficientStockException when stock is insufficient")
    void testCheckoutWalkIn_InsufficientStock_ThrowsException() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(cashierUser));
        when(productRepository.findByIdAndIsDeletedFalse(100L)).thenReturn(Optional.of(sampleProduct));
        when(batchAllocationService.getAvailableStock(100L)).thenReturn(3); // only 3 in stock

        List<CashierService.PosCartItemDto> items = List.of(
                new CashierService.PosCartItemDto(100L, 10) // requesting 10
        );

        assertThrows(InsufficientStockException.class, () ->
                cashierService.checkoutWalkIn(10L, items, new BigDecimal("250.00"), PaymentMethod.CASH)
        );
    }

    @Test
    @DisplayName("Shift Management: Open shift and close shift with drawer cash variance calculation")
    void testShiftLifecycle_OpenAndCloseVariance() {
        when(posShiftRepository.existsByCashier_IdAndStatus(10L, PosShiftStatus.OPEN)).thenReturn(false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(cashierUser));
        when(posShiftRepository.save(any(PosShift.class))).thenAnswer(invocation -> {
            PosShift s = invocation.getArgument(0);
            s.setId(1L);
            return s;
        });

        // 1. Open shift with $100 opening float
        CashierService.PosShiftDto opened = cashierService.openShift(10L, new BigDecimal("100.00"), "Morning Shift");
        assertEquals(PosShiftStatus.OPEN, opened.status());
        assertEquals(new BigDecimal("100.00"), opened.openingFloat());

        // 2. Prepare mock open shift with $200 system cash sales
        PosShift activeShift = PosShift.builder()
                .id(1L)
                .cashier(cashierUser)
                .openedAt(LocalDateTime.now().minusHours(8))
                .openingFloat(new BigDecimal("100.00"))
                .systemCashTotal(new BigDecimal("200.00"))
                .totalTransactions(15)
                .status(PosShiftStatus.OPEN)
                .build();

        when(posShiftRepository.findTopByCashier_IdAndStatusOrderByOpenedAtDesc(10L, PosShiftStatus.OPEN))
                .thenReturn(Optional.of(activeShift));

        // Drawer counted cash is $295.00 (expected is $100 float + $200 sales = $300 -> variance -$5.00)
        CashierService.PosShiftDto closed = cashierService.closeShift(10L, new BigDecimal("295.00"), "Drawer short $5");

        assertEquals(PosShiftStatus.CLOSED, closed.status());
        assertEquals(new BigDecimal("295.00"), closed.closingCash());
        assertEquals(new BigDecimal("-5.00"), closed.cashVariance());
    }

    @Test
    @DisplayName("Barcode Scanner: Scans SKU and returns product details and real-time available stock")
    void testScanProduct_Success() {
        when(productRepository.findBySkuAndIsDeletedFalse("SKU-ENERGY-BAR")).thenReturn(Optional.of(sampleProduct));
        when(batchAllocationService.getAvailableStock(100L)).thenReturn(42);

        CashierService.PosProductScanDto scan = cashierService.scanProduct("SKU-ENERGY-BAR");

        assertEquals(100L, scan.id());
        assertEquals("SKU-ENERGY-BAR", scan.sku());
        assertEquals("Organic Energy Bar", scan.name());
        assertEquals(new BigDecimal("20.00"), scan.retailPrice());
        assertEquals(42, scan.availableStock());
        assertTrue(scan.isPerishable());
    }

    @Test
    @DisplayName("Thermal Receipt: Generates 80mm thermal receipt payload with store header and items")
    void testGetReceipt_Success() {
        Order order = Order.builder()
                .id(99L)
                .orderNumber("POS-20261008-001")
                .channel(OrderChannel.POS)
                .cashier(cashierUser)
                .subtotal(new BigDecimal("40.00"))
                .taxAmount(new BigDecimal("2.80"))
                .totalAmount(new BigDecimal("42.80"))
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .product(sampleProduct)
                .quantity(2)
                .unitPrice(new BigDecimal("20.00"))
                .subtotal(new BigDecimal("40.00"))
                .build();

        when(orderRepository.findByOrderNumber("POS-20261008-001")).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrder_Id(99L)).thenReturn(List.of(item));

        CashierService.ThermalReceiptDto receipt = cashierService.getReceipt("POS-20261008-001");

        assertNotNull(receipt);
        assertEquals("ONLINE RETAIL POS - STORE #01", receipt.storeName());
        assertEquals("POS-20261008-001", receipt.orderNumber());
        assertEquals("Jane Doe", receipt.cashierName());
        assertEquals(1, receipt.items().size());
        assertEquals("Organic Energy Bar", receipt.items().get(0).productName());
        assertEquals(new BigDecimal("42.80"), receipt.grandTotal());
        assertTrue(receipt.barcodeData().contains("POS-20261008-001"));
    }
}

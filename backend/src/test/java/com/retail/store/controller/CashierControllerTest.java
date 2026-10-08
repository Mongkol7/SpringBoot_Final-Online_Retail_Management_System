package com.retail.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.store.dto.cashier.request.CashierLoginRequest;
import com.retail.store.dto.cashier.request.CloseShiftRequest;
import com.retail.store.dto.cashier.request.OpenShiftRequest;
import com.retail.store.dto.cashier.request.PosCartItemRequest;
import com.retail.store.dto.cashier.request.PosWalkInRequest;
import com.retail.store.entity.Order;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.PosShiftStatus;
import com.retail.store.service.AuthService;
import com.retail.store.service.CashierService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.retail.store.mapper.cashier.CashierMapper;
import org.springframework.context.annotation.Import;

@WebMvcTest(CashierController.class)
@Import(CashierMapper.class)
@AutoConfigureMockMvc(addFilters = false) // focus on controller endpoints & serialization
class CashierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CashierService cashierService;

    @MockBean
    private com.retail.store.security.jwt.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.retail.store.security.user.CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("POST /pos/login: Authenticates cashier staff successfully")
    void testCashierLogin() throws Exception {
        AuthService.AuthResponse authResponse = new AuthService.AuthResponse(
                "mock-jwt-token",
                10L,
                "cashier@retailstore.com",
                "Jane Doe",
                "CASHIER",
                CustomerType.RETAIL
        );

        when(cashierService.login("cashier@retailstore.com", "cashier123")).thenReturn(authResponse);

        CashierLoginRequest request = new CashierLoginRequest(
                "cashier@retailstore.com", "cashier123"
        );

        mockMvc.perform(post("/pos/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.role").value("CASHIER"))
                .andExpect(jsonPath("$.email").value("cashier@retailstore.com"));
    }

    @Test
    @DisplayName("POST /pos/checkout: Processes walk-in checkout and returns 201 Created")
    @WithMockUser(username = "cashier@retailstore.com", roles = {"CASHIER"})
    void testCheckoutWalkInEndpoint() throws Exception {
        Order mockOrder = Order.builder()
                .id(1L)
                .orderNumber("POS-12345")
                .channel(OrderChannel.POS)
                .subtotal(new BigDecimal("40.00"))
                .taxAmount(new BigDecimal("2.80"))
                .totalAmount(new BigDecimal("42.80"))
                .build();

        CashierService.PosCheckoutResult result = new CashierService.PosCheckoutResult(
                mockOrder, new BigDecimal("50.00"), new BigDecimal("7.20")
        );

        when(cashierService.checkoutWalkIn(any(), any(), any(), any(), any())).thenReturn(result);

        PosWalkInRequest request = new PosWalkInRequest(
                10L,
                null,
                List.of(new PosCartItemRequest(100L, 2)),
                new BigDecimal("50.00"),
                PaymentMethod.CASH
        );

        mockMvc.perform(post("/pos/checkout")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amountTendered").value(50.00))
                .andExpect(jsonPath("$.changeDue").value(7.20))
                .andExpect(jsonPath("$.order.orderNumber").value("POS-12345"));
    }

    @Test
    @DisplayName("GET /pos/receipts/{orderNumber}: Returns formatted 80mm thermal receipt")
    void testGetReceiptEndpoint() throws Exception {
        CashierService.ThermalReceiptDto receipt = new CashierService.ThermalReceiptDto(
                "ONLINE RETAIL POS - STORE #01",
                "TERM-POS-01",
                "Jane Doe",
                "POS-12345",
                "2026-10-08 10:00:00",
                List.of(new CashierService.ReceiptItemDto("Energy Bar", 2, new BigDecimal("20.00"), new BigDecimal("40.00"))),
                new BigDecimal("40.00"),
                new BigDecimal("2.80"),
                new BigDecimal("42.80"),
                new BigDecimal("50.00"),
                new BigDecimal("7.20"),
                "RCP*POS-12345*V1"
        );

        when(cashierService.getReceipt("POS-12345")).thenReturn(receipt);

        mockMvc.perform(get("/pos/receipts/POS-12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeName").value("ONLINE RETAIL POS - STORE #01"))
                .andExpect(jsonPath("$.orderNumber").value("POS-12345"))
                .andExpect(jsonPath("$.grandTotal").value(42.80))
                .andExpect(jsonPath("$.barcodeData").value("RCP*POS-12345*V1"));
    }

    @Test
    @DisplayName("POST /pos/shift/open: Opens cashier shift")
    void testOpenShiftEndpoint() throws Exception {
        CashierService.PosShiftDto shiftDto = new CashierService.PosShiftDto(
                1L, 10L, "Jane Doe", LocalDateTime.now(), null,
                new BigDecimal("100.00"), null, BigDecimal.ZERO, null, 0,
                PosShiftStatus.OPEN, "Morning"
        );

        when(cashierService.openShift(eq(10L), any(), any())).thenReturn(shiftDto);

        OpenShiftRequest request = new OpenShiftRequest(
                10L, new BigDecimal("100.00"), "Morning"
        );

        mockMvc.perform(post("/pos/shift/open")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.openingFloat").value(100.00));
    }

    @Test
    @DisplayName("POST /pos/shift/close: Closes cashier shift and returns reconciliation")
    void testCloseShiftEndpoint() throws Exception {
        CashierService.PosShiftDto shiftDto = new CashierService.PosShiftDto(
                1L, 10L, "Jane Doe", LocalDateTime.now().minusHours(8), LocalDateTime.now(),
                new BigDecimal("100.00"), new BigDecimal("350.00"), new BigDecimal("350.00"), BigDecimal.ZERO, 15,
                PosShiftStatus.CLOSED, "Shift closed smoothly"
        );

        when(cashierService.closeShift(eq(10L), any(), any())).thenReturn(shiftDto);

        CloseShiftRequest request = new CloseShiftRequest(
                10L, new BigDecimal("350.00"), "Shift closed smoothly"
        );

        mockMvc.perform(post("/pos/shift/close")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.closingCash").value(350.00))
                .andExpect(jsonPath("$.cashVariance").value(0));
    }

    @Test
    @DisplayName("GET /pos/shift/current: Retrieves active shift details")
    void testGetCurrentShiftEndpoint() throws Exception {
        CashierService.PosShiftDto shiftDto = new CashierService.PosShiftDto(
                1L, 10L, "Jane Doe", LocalDateTime.now().minusHours(2), null,
                new BigDecimal("100.00"), null, new BigDecimal("250.00"), null, 8,
                PosShiftStatus.OPEN, "Active"
        );

        when(cashierService.getCurrentShift(10L)).thenReturn(shiftDto);

        mockMvc.perform(get("/pos/shift/current").param("cashierId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.cashierName").value("Jane Doe"))
                .andExpect(jsonPath("$.totalTransactions").value(8));
    }

    @Test
    @DisplayName("GET /pos/products/scan/{sku}: Scans product SKU and returns live stock")
    void testScanProductEndpoint() throws Exception {
        CashierService.PosProductScanDto scan = new CashierService.PosProductScanDto(
                100L, "SKU-ENERGY-BAR", "Energy Bar", new BigDecimal("20.00"), 35, true
        );

        when(cashierService.scanProduct("SKU-ENERGY-BAR")).thenReturn(scan);

        mockMvc.perform(get("/pos/products/scan/SKU-ENERGY-BAR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("SKU-ENERGY-BAR"))
                .andExpect(jsonPath("$.availableStock").value(35))
                .andExpect(jsonPath("$.retailPrice").value(20.00));
    }
}

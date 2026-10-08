package com.retail.store.mapper.cashier;

import com.retail.store.dto.cashier.response.*;
import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.PosShift;
import com.retail.store.entity.Product;
import com.retail.store.service.AuthService;
import com.retail.store.service.CashierService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 2 (CASHIER Role)
 * =========================================================================
 * Dedicated mapper bean responsible for converting Cashier Domain Entities
 * and Service DTOs into enterprise-standard HTTP API response records.
 * =========================================================================
 */
@Component
public class CashierMapper {

    public CashierLoginResponse toLoginResponse(AuthService.AuthResponse auth) {
        if (auth == null) {
            return null;
        }
        return new CashierLoginResponse(
                auth.token(),
                auth.userId(),
                auth.email(),
                auth.fullName(),
                auth.role(),
                auth.customerType()
        );
    }

    public PosOrderItemResponse toOrderItemResponse(OrderItem item) {
        if (item == null) {
            return null;
        }
        return new PosOrderItemResponse(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProduct() != null ? item.getProduct().getName() : null,
                item.getProduct() != null ? item.getProduct().getSku() : null,
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }

    public PosOrderResponse toOrderResponse(Order order) {
        if (order == null) {
            return null;
        }
        List<PosOrderItemResponse> items = (order.getItems() == null) ? List.of() :
                order.getItems().stream()
                        .map(this::toOrderItemResponse)
                        .toList();

        Long cashierId = (order.getCashier() != null) ? order.getCashier().getId() : null;

        return new PosOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getChannel(),
                cashierId,
                order.getPricingTierUsed(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                items
        );
    }

    public PosCheckoutResponse toCheckoutResponse(Order order, BigDecimal amountTendered, BigDecimal changeDue) {
        return new PosCheckoutResponse(
                toOrderResponse(order),
                amountTendered,
                changeDue
        );
    }

    public PosCheckoutResponse toCheckoutResponse(CashierService.PosCheckoutResult result) {
        if (result == null) {
            return null;
        }
        return toCheckoutResponse(result.order(), result.amountTendered(), result.changeDue());
    }

    public ReceiptItemResponse toReceiptItemResponse(CashierService.ReceiptItemDto dto) {
        if (dto == null) {
            return null;
        }
        return new ReceiptItemResponse(
                dto.productName(),
                dto.quantity(),
                dto.unitPrice(),
                dto.subtotal()
        );
    }

    public ThermalReceiptResponse toThermalReceiptResponse(CashierService.ThermalReceiptDto dto) {
        if (dto == null) {
            return null;
        }
        List<ReceiptItemResponse> items = (dto.items() == null) ? List.of() :
                dto.items().stream()
                        .map(this::toReceiptItemResponse)
                        .toList();

        return new ThermalReceiptResponse(
                dto.storeName(),
                dto.terminalId(),
                dto.cashierName(),
                dto.orderNumber(),
                dto.dateTime(),
                items,
                dto.subtotal(),
                dto.taxAmount(),
                dto.grandTotal(),
                dto.amountTendered(),
                dto.changeDue(),
                dto.barcodeData()
        );
    }

    public PosShiftResponse toShiftResponse(PosShift shift) {
        if (shift == null) {
            return null;
        }
        Long cashierId = (shift.getCashier() != null) ? shift.getCashier().getId() : null;
        String cashierName = (shift.getCashier() != null) ? shift.getCashier().getFullName() : null;

        return new PosShiftResponse(
                shift.getId(),
                cashierId,
                cashierName,
                shift.getOpenedAt(),
                shift.getClosedAt(),
                shift.getOpeningFloat(),
                shift.getClosingCash(),
                shift.getSystemCashTotal(),
                shift.getCashVariance(),
                shift.getTotalTransactions(),
                shift.getStatus(),
                shift.getNotes()
        );
    }

    public PosShiftResponse toShiftResponse(CashierService.PosShiftDto dto) {
        if (dto == null) {
            return null;
        }
        return new PosShiftResponse(
                dto.id(),
                dto.cashierId(),
                dto.cashierName(),
                dto.openedAt(),
                dto.closedAt(),
                dto.openingFloat(),
                dto.closingCash(),
                dto.systemCashTotal(),
                dto.cashVariance(),
                dto.totalTransactions(),
                dto.status(),
                dto.notes()
        );
    }

    public PosProductScanResponse toProductScanResponse(CashierService.PosProductScanDto dto) {
        if (dto == null) {
            return null;
        }
        return new PosProductScanResponse(
                dto.id(),
                dto.sku(),
                dto.name(),
                dto.imageUrl(),
                dto.retailPrice(),
                dto.availableStock(),
                dto.isPerishable()
        );
    }

    public PosProductScanResponse toProductScanResponse(Product product, int availableStock) {
        if (product == null) {
            return null;
        }
        return new PosProductScanResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getImageUrl(),
                product.getRetailPrice(),
                availableStock,
                product.getIsPerishable()
        );
    }
}

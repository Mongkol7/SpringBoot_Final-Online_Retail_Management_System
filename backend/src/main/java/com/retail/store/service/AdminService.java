package com.retail.store.service;

import com.retail.store.entity.InventoryTransaction;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface AdminService {
    WholesaleApplication approveWholesale(Long applicationId, Long adminUserId);
    WholesaleApplication rejectWholesale(Long applicationId, Long adminUserId, String rejectionNotes);
    Page<WholesaleApplication> getWholesaleApplications(String status, Pageable pageable);

    User toggleUserActive(Long targetUserId);
    User changeUserRole(Long targetUserId, String roleName);
    Page<User> getAllUsers(Pageable pageable);
    User createUser(CreateUserRequest request);
    User updateUser(Long targetUserId, UpdateUserRequest request);
    void deleteUser(Long targetUserId);

    record CreateUserRequest(
            String fullName,
            String email,
            String password,
            String phone,
            String roleName,
            String customerType
    ) {}

    record UpdateUserRequest(
            String fullName,
            String email,
            String phone,
            String roleName,
            String customerType,
            Boolean isActive,
            String password
    ) {}

    Page<InventoryTransaction> getAuditLogs(String type, java.time.LocalDateTime start, java.time.LocalDateTime end, Pageable pageable);
    default Page<InventoryTransaction> getAuditLogs(Pageable pageable) {
        return getAuditLogs(null, null, null, pageable);
    }

    ExecutiveKpiSummary getDashboardSummary();
    java.util.List<SalesSeriesPointDto> getSalesSeries(int days);
    default java.util.List<SalesSeriesPointDto> getSalesSeries(int days, Integer year) {
        return getSalesSeries(days);
    }

    java.util.List<AdminProductDetailDto> getAllProducts();
    AdminProductDetailDto getProductDetail(Long productId);

    default java.util.List<AdminPaymentDto> getAllPayments(String channel, String paymentMethod, String status) {
        return getAllPayments(channel, paymentMethod, status, "ALL");
    }
    java.util.List<AdminPaymentDto> getAllPayments(String channel, String paymentMethod, String status, String customerCategory);
    AdminPaymentDto getPaymentDetail(String orderNumber);
    java.util.List<CustomerSpendingSummaryDto> getCustomerSpendingSummary(String customerCategory);
    FinancialTaxReportDto getFinancialTaxReport();
    String generateFinancialTaxCsv();

    com.retail.store.entity.Order confirmOrder(Long orderId, Long adminUserId);
    Page<com.retail.store.entity.Order> getAllOrders(String status, Pageable pageable);

    record ExecutiveKpiSummary(
            BigDecimal totalGrossRevenue,
            BigDecimal onlineRevenue,
            BigDecimal posRevenue,
            long onlineOrdersCount,
            long posOrdersCount,
            long pendingWholesaleApplicationsCount,
            long expiredBatchesCount,
            int lowStockProductsCount
    ) {}

    record SalesSeriesPointDto(
            String date,
            BigDecimal onlineRevenue,
            BigDecimal posRevenue,
            BigDecimal totalRevenue,
            long orderCount
    ) {}

    record AdminProductDetailDto(
            Long id,
            String sku,
            String name,
            String description,
            String categoryName,
            String imageUrl,
            BigDecimal costPrice,
            BigDecimal retailPrice,
            BigDecimal wholesalePrice,
            BigDecimal retailMarginPercent,
            BigDecimal wholesaleMarginPercent,
            int availableStock,
            int minStockThreshold,
            boolean isPerishable,
            String currentBatchCode,
            java.time.LocalDate currentBatchExpiryDate,
            java.util.List<BatchItemDto> batches
    ) {}

    record BatchItemDto(
            Long id,
            String batchCode,
            int initialQuantity,
            int currentQuantity,
            java.time.LocalDate expiryDate,
            boolean isExpired,
            java.time.LocalDateTime receivedAt
    ) {}

    record AdminPaymentDto(
            Long id,
            String orderNumber,
            String channel,
            String paymentMethod,
            String status,
            String pricingTierUsed,
            String customerCategory,
            String customerName,
            String customerEmail,
            String cashierName,
            int itemCount,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal totalAmount,
            java.time.LocalDateTime createdAt,
            java.util.List<AdminPaymentItemDto> items
    ) {
        public AdminPaymentDto(
                Long id, String orderNumber, String channel, String paymentMethod, String status,
                String pricingTierUsed, String customerName, String customerEmail, String cashierName,
                int itemCount, BigDecimal subtotal, BigDecimal taxAmount, BigDecimal totalAmount,
                java.time.LocalDateTime createdAt, java.util.List<AdminPaymentItemDto> items
        ) {
            this(
                    id, orderNumber, channel, paymentMethod, status, pricingTierUsed,
                    "WHOLESALE".equalsIgnoreCase(pricingTierUsed) ? "WHOLESALE" : ("POS".equalsIgnoreCase(channel) ? "WALK_IN" : "ONLINE"),
                    customerName, customerEmail, cashierName, itemCount, subtotal, taxAmount, totalAmount, createdAt, items
            );
        }
    }

    record AdminPaymentItemDto(
            Long id,
            String productName,
            String sku,
            String imageUrl,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {
        public AdminPaymentItemDto(Long id, String productName, String sku, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
            this(id, productName, sku, null, quantity, unitPrice, subtotal);
        }
    }

    record CustomerSpendingSummaryDto(
            String customerName,
            String customerEmail,
            String customerCategory,
            String pricingTier,
            int totalOrders,
            int totalItemsPurchased,
            BigDecimal totalSpending,
            BigDecimal totalNet,
            BigDecimal totalTax,
            BigDecimal averageOrderValue,
            java.time.LocalDateTime lastOrderDate,
            java.util.List<AdminPaymentDto> payments
    ) {}

    record FinancialTaxReportDto(
            BigDecimal totalGrossRevenue,
            BigDecimal totalTaxCollected,
            BigDecimal totalNetRevenue,
            BigDecimal posGrossRevenue,
            BigDecimal posTaxCollected,
            BigDecimal onlineGrossRevenue,
            BigDecimal onlineTaxCollected,
            BigDecimal cardTotal,
            BigDecimal cashTotal,
            BigDecimal bankTransferTotal,
            long totalOrdersCount,
            long posOrdersCount,
            long onlineOrdersCount,
            java.time.LocalDateTime generatedAt
    ) {}
}

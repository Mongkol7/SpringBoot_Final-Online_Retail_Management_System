# 🏢 Role-Based Full-Stack & System Task Division (Team of 4)
### *1 Person = 1 System Role (Complete End-to-End Backend & Business Logic)*
### *Directly Synced with Official ERD (PostgreSQL 18)*

> **Document Version:** 3.0.0 (Role-Dedicated Architecture)  
> **Database:** PostgreSQL 18 (`E-bookstrore_db`, password: `123`)  
> **Backend Framework:** Spring Boot 3.x, Spring Data JPA / Hibernate, Spring Security 6 (JWT + BCrypt)  
> **Team Division Model:** **1 Person per Role** (`USER`, `CASHIER`, `STOCK_CONTROLLER`, `ADMIN`)  
> **Zero-Conflict Strategy:** Each developer has 100% isolated ownership of their role's controllers, services, database tables, and security boundaries.

---

## 📌 Table of Contents
1. [Team Role Assignment Matrix](#1-team-role-assignment-matrix)
2. [Official 12-Entity Database Schema & Role Ownership](#2-official-12-entity-database-schema--role-ownership)
3. [Person 1: USER Role Lead (Online Customer Experience & Orders)](#3-person-1-user-role-lead-online-customer-experience--orders)
4. [Person 2: CASHIER Role Lead (In-Store Point of Sale & Receipts)](#4-person-2-cashier-role-lead-in-store-point-of-sale--receipts)
5. [Person 3: STOCK_CONTROLLER Role Lead (Catalog, Batches & FIFO/FEFO Engine)](#5-person-3-stock_controller-role-lead-catalog-batches--fifofefo-engine)
6. [Person 4: ADMIN Role Lead (Governance, Wholesale Review & Executive HUD)](#6-person-4-admin-role-lead-governance-wholesale-review--executive-hud)
7. [Cross-Role Integration Contracts & Anti-Conflict Rules](#7-cross-role-integration-contracts--anti-conflict-rules)
8. [Database Migration Plan (Flyway / Liquibase)](#8-database-migration-plan-flyway--liquibase)

---

## 1. Team Role Assignment Matrix

The system consists of exactly **4 distinct business actors**. Each developer owns one actor's entire technical stack:

| Team Member | System Role Owned | Primary Target Persona | Primary Business Responsibility | Endpoints Prefix |
| :--- | :--- | :--- | :--- | :--- |
| **Person 1** | **`USER`** | Online Customer (Retail & Wholesale) | Registration, Customer Auth, Shopping Cart, Online Checkout (`channel = ONLINE`), Dynamic Pricing (Retail vs. Wholesale), Order Tracking & Cancellation, Wholesale Application submission. | `/api/v1/auth/**`<br>`/api/v1/customer/**`<br>`/api/v1/cart/**`<br>`/api/v1/orders/online/**` |
| **Person 2** | **`CASHIER`** | In-Store Sales Staff | Staff POS Authentication, Walk-In Checkout (`channel = POS`), **Strict Retail Price lock** (no wholesale), Change calculation, 80mm thermal receipt payload generation, Cashier shift drawer reconciliation. | `/api/v1/cashier/**`<br>`/api/v1/pos/**`<br>`/api/v1/receipts/**` |
| **Person 3** | **`STOCK_CONTROLLER`** | Inventory & Warehouse Manager | Product Cataloging, Soft-delete, 3-tier pricing (Cost, Retail, Wholesale), Supplier directory, Stock-In batch ingestion, **FIFO & FEFO allocation engine**, Expiry date watcher, Low-stock alert threshold. | `/api/v1/inventory/**`<br>`/api/v1/products/**`<br>`/api/v1/batches/**`<br>`/api/v1/suppliers/**` |
| **Person 4** | **`ADMIN`** | Business Administrator / Executive | System user governance (Activate/Deactivate, role promotion), **Wholesale application review queue** (Approve/Reject with notes), Executive KPI summary (Gross revenue, online vs POS ratio), System audit log viewer. | `/api/v1/admin/**`<br>`/api/v1/admin/wholesale/**`<br>`/api/v1/admin/users/**`<br>`/api/v1/admin/dashboard/**` |

---

## 2. Official 12-Entity Database Schema & Role Ownership

```
                      ┌────────────────────────────────────────────────────────┐
                      │              SHARED ROLES & AUTH FOUNDATION            │
                      │               Role  (1) ────◄ (N) User                 │
                      └───────────────────────┬────────────────────────────────┘
                                              │
         ┌───────────────────┬────────────────┴──────────────────┬───────────────────┐
         ▼                   ▼                                   ▼                   ▼
     PERSON 1            PERSON 2                            PERSON 3            PERSON 4
  (USER Role)         (CASHIER Role)                 (STOCK_CONTROLLER)       (ADMIN Role)
 ┌─────────────────┐ ┌─────────────────┐             ┌─────────────────────┐ ┌─────────────────┐
 │ • CartItem      │ │ • Order (POS)   │             │ • Category          │ │ • WholesaleApp  │
 │ • Order (ONLINE)│ │ • OrderItem     │             │ • Product           │ │   (Review/Decide│
 │ • OrderItem     │ │   (POS Items)   │             │ • Supplier          │ │ • User Directory│
 │ • WholesaleApp  │ │ • POS Cash Float│             │ • ProductBatch      │ │ • Audit Reports │
 │   (Submit only) │ └────────┬────────┘             │ • OrderItemBatch-   │ │ • Executive KPI │
 └────────┬────────┘          │                      │   Fulfillment       │ │   Analytics     │
          │                   │                      │ • Inventory-        │ └─────────────────┘
          │                   │                      │   Transaction       │
          └───────────────────┴─────────────────────►│ (Batch Allocation)  │
                                                     └─────────────────────┘
```

---

## 3. Person 1: USER Role Lead (Online Customer Experience & Orders)

### 3.1 Role Scope & Mission
Person 1 is responsible for the entire digital customer journey. Standard users register as `RETAIL` customers by default. If their account has been approved by the Admin as `WHOLESALE`, Person 1's pricing engine automatically applies wholesale bulk discounts.

### 3.2 ERD Entities Owned & Managed
- **`CartItem`**: `id`, `userId`, `productId`, `quantity`, `createdAt`
- **`Order` (Online Flow)**: `id`, `orderNumber`, `channel = ONLINE`, `userId`, `cashierId = NULL`, `shippingAddress`, `status`, `paymentMethod`, `pricingTierUsed`, `subtotal`, `taxAmount`, `totalAmount`, `createdAt`
- **`OrderItem` (Online Items)**: `id`, `orderId`, `productId`, `quantity`, `unitPrice`, `subtotal`
- **`WholesaleApplication` (Customer submission)**: Creates initial pending request

### 3.3 Actionable Task Breakdown
- [ ] **Task 1.1: Customer Authentication & Profile**
  - `POST /api/v1/auth/register`: Public registration.
    - Automatically hashes password with `BCrypt(12)`.
    - Baseline: `role = USER`, `customerType = RETAIL`, `isActive = true`.
  - `POST /api/v1/auth/login`: Customer login returning JWT (claims: `userId`, `role=USER`, `customerType`).
  - `GET /api/v1/customer/profile`: Customer address book & profile management.
- [ ] **Task 1.2: Dynamic Shopping Cart Engine (`CartItem`)**
  - `GET /api/v1/cart`: Fetches cart items for authenticated user.
    - **Dynamic Price Resolution:**
      - If `user.customerType == 'WHOLESALE'`: Applies `product.wholesalePrice`.
      - If `user.customerType == 'RETAIL'`: Applies `product.retailPrice`.
  - `POST /api/v1/cart/items`: Add or update item quantity.
  - `DELETE /api/v1/cart/items/{id}`: Remove item.
  - `DELETE /api/v1/cart`: Clear cart.
- [ ] **Task 1.3: Online Checkout Pipeline (`Order`, `OrderItem`)**
  - `POST /api/v1/orders/online/checkout`:
    - Validates shipping address and payment method (`CARD`, `BANK_TRANSFER`, `CASH`).
    - Calculates `subtotal`, `taxAmount`, and `totalAmount`.
    - Persists `Order` (`channel = ONLINE`, `cashierId = NULL`, `status = PAID`).
    - Persists `OrderItem` records with unit price according to `pricingTierUsed`.
    - Calls Person 3's `BatchAllocationService.allocateAndDeductBatches(...)` to link each `OrderItem` to `OrderItemBatchFulfillment` records.
    - Clears user's cart upon successful transaction.
- [ ] **Task 1.4: Order Tracking & Customer Cancellation**
  - `GET /api/v1/orders/my-orders`: Paginated order history.
  - `GET /api/v1/orders/{orderNumber}`: Itemized breakdown, unit prices, applied tier, and fulfillment batch transparency.
  - `POST /api/v1/orders/{orderNumber}/cancel`:
    - Allows cancellation if order is in `PENDING` or `PROCESSING` state.
    - Invokes Person 3's stock restoration method.
- [ ] **Task 1.5: Wholesale Account Application Submission**
  - `POST /api/v1/customer/wholesale-application`:
    - Submits `businessName` and `taxIdOrLicense`.
    - Inserts `WholesaleApplication` with `status = PENDING`.
  - `GET /api/v1/customer/wholesale-application/status`: Check current approval state.

---

## 4. Person 2: CASHIER Role Lead (In-Store Point of Sale & Receipts)

### 4.1 Role Scope & Mission
Person 2 is responsible for in-store sales staff operations. The POS must be ultra-fast, support high-frequency walk-in checkout, calculate cash change, print 80mm thermal receipts, and **strictly enforce Retail Pricing**.

### 4.2 ERD Entities Owned & Managed
- **`Order` (POS Channel)**: `id`, `orderNumber`, `channel = POS`, `userId` (walk-in/customer ID), `cashierId` (authenticated staff user ID), `shippingAddress = "IN-STORE"`, `status = PAID`, `pricingTierUsed = RETAIL`, `subtotal`, `taxAmount`, `totalAmount`, `createdAt`
- **`OrderItem` (POS Items)**: `id`, `orderId`, `productId`, `quantity`, `unitPrice` (strictly `product.retailPrice`), `subtotal`

### 4.3 Actionable Task Breakdown
- [ ] **Task 2.1: Cashier Staff Authentication & PIN Login**
  - `POST /api/v1/cashier/login`: Secure staff login ensuring user has `role = CASHIER` and `isActive = true`.
- [ ] **Task 2.2: Walk-In POS Checkout Pipeline**
  - `POST /api/v1/pos/checkout`:
    - **CRITICAL BUSINESS RULE:** Strictly sets `pricingTierUsed = RETAIL`. Cashiers are **permanently blocked** from issuing Wholesale pricing.
    - Sets `channel = POS`.
    - Populates `cashierId = currentStaffUser.getId()`.
    - Sets `shippingAddress = "IN-STORE"`.
    - Calculates totals using `product.retailPrice`.
    - Creates `Order` and `OrderItem` records.
    - Invokes Person 3's `BatchAllocationService.allocateAndDeductBatches(orderItem.getId(), productId, qty, cashierId, TransactionType.POS_SALE)`.
    - Calculates change: `change = amountTendered - totalAmount` (throws `InsufficientCashTenderedException` if cash < total).
- [ ] **Task 2.3: 80mm Thermal Receipt Generator**
  - `GET /api/v1/pos/receipts/{orderNumber}`:
    - Generates 80mm thermal receipt payload:
      - Store Header, Cashier Name, Staff ID.
      - Sequential Receipt Number (`RCP-POS-XXXX`), Timestamp.
      - Line items: Qty, Product Name, Retail Unit Price, Subtotal.
      - Subtotal, Tax Amount, Grand Total.
      - Amount Tendered, Change Due.
      - Barcode / QR verification string.
- [ ] **Task 2.4: Cashier Shift Reconciliation & Float Management**
  - `POST /api/v1/pos/shift/open`: Log opening cash float.
  - `POST /api/v1/pos/shift/close`: Log closing cash drawer balance, calculate daily variance (`Recorded Cash vs. System Total`).
  - `GET /api/v1/pos/shift/current`: View current cashier shift transaction count and cash total.

---

## 5. Person 3: STOCK_CONTROLLER Role Lead (Catalog, Batches & FIFO/FEFO Engine)

### 5.1 Role Scope & Mission
Person 3 is the master of physical inventory. Responsible for product cataloging with 3 pricing tiers, supplier management, receiving stock-in batches, running the **FIFO and FEFO batch allocation engine**, and preventing the sale of expired goods.

### 5.2 ERD Entities Owned & Managed
- **`Category`**: `id`, `name`, `description`
- **`Supplier`**: `id`, `name`, `contactName`, `email`, `phone`, `address`
- **`Product`**: `id`, `categoryId`, `sku`, `name`, `description`, `imageUrl`, `costPrice`, `retailPrice`, `wholesalePrice`, `minStockThreshold`, `isPerishable`, `isDeleted`, `createdAt`, `updatedAt`
- **`ProductBatch`**: `id`, `batchCode`, `productId`, `supplierId`, `initialQuantity`, `currentQuantity`, `expiryDate`, `isExpired`, `receivedAt`
- **`OrderItemBatchFulfillment`**: `id`, `orderItemId`, `batchId`, `quantityDeducted`
- **`InventoryTransaction`**: `id`, `batchId`, `userId`, `type`, `quantityDelta`, `reason`, `createdAt`

### 5.3 Actionable Task Breakdown
- [ ] **Task 3.1: Product Catalog & Pricing Management**
  - CRUD for `Category` and `Supplier`.
  - CRUD for `Product`:
    - Enforces pricing hierarchy: `costPrice <= wholesalePrice <= retailPrice`.
    - Soft delete: sets `isDeleted = true` so foreign keys in past orders remain valid.
    - Exposes public catalog API: `GET /api/v1/products` (filtering by category, keyword search, active-only).
- [ ] **Task 3.2: Stock-In Batch Ingestion**
  - `POST /api/v1/inventory/batches/stock-in` (Auth: STOCK_CONTROLLER):
    - Validates batch code uniqueness and future expiry date (if product is perishable).
    - Persists `ProductBatch` with `currentQuantity = initialQuantity`, `isExpired = false`.
    - Creates immutable record in `InventoryTransaction` (`type = STOCK_IN`, `quantityDelta = +initialQuantity`, `userId = stockControllerId`).
- [ ] **Task 3.3: FIFO & FEFO Batch Allocation Service (Core Engine)**
  - Implements `BatchAllocationService`:
    ```java
    @Transactional
    List<OrderItemBatchFulfillment> allocateAndDeductBatches(
        Long orderItemId, Long productId, int requestedQty, Long actorUserId, TransactionType type
    );
    ```
  - **Algorithm Logic:**
    1. Query active batches for `productId` where `currentQuantity > 0` AND `isExpired = false` AND (`expiryDate IS NULL` OR `expiryDate > CURRENT_DATE`).
    2. Sorting strategy:
       - If `product.isPerishable == true`: Sort by `expiryDate ASC, receivedAt ASC` (**FEFO**).
       - If `product.isPerishable == false`: Sort by `receivedAt ASC, id ASC` (**FIFO**).
    3. Loop through sorted batches:
       - Deduct quantity: `deducted = Math.min(batch.currentQuantity, remainingQty)`.
       - Update batch: `batch.currentQuantity -= deducted`.
       - Insert `OrderItemBatchFulfillment` (`orderItemId`, `batchId`, `quantityDeducted = deducted`).
       - Insert `InventoryTransaction` (`batchId`, `userId = actorUserId`, `type = type`, `quantityDelta = -deducted`).
       - `remainingQty -= deducted`.
       - Stop when `remainingQty == 0`.
    4. If total active stock < requested quantity, throw `InsufficientStockException` (triggers database rollback).
- [ ] **Task 3.4: Automated Expiry Watcher & Threshold Alerts**
  - `@Scheduled(cron = "0 0 1 * * ?")`: Daily midnight scheduler: sets `ProductBatch.isExpired = true` for batches where `expiryDate <= CURRENT_DATE`.
  - `GET /api/v1/inventory/alerts/low-stock`: Returns products whose active stock is below `minStockThreshold`.
  - `POST /api/v1/inventory/adjustments`: Manual stock adjustments or damaged goods write-offs.

---

## 6. Person 4: ADMIN Role Lead (Governance, Wholesale Review & Executive HUD)

### 6.1 Role Scope & Mission
Person 4 is responsible for system governance, user administration, reviewing business customer wholesale requests, querying the central audit log, and presenting executive KPIs on gross sales and inventory health.

### 6.2 ERD Entities Owned & Managed
- **`Role`**: `id`, `name` (`USER`, `CASHIER`, `ADMIN`, `STOCK_CONTROLLER`)
- **`User` (Governance)**: `id`, `roleId`, `isActive`, etc.
- **`WholesaleApplication` (Review & Decision)**: `status`, `reviewedBy`, `reviewedAt`, `adminNotes`
- **System Executive Aggregations**: Reads from `Order`, `OrderItem`, `ProductBatch`, and `InventoryTransaction`

### 6.3 Actionable Task Breakdown
- [ ] **Task 4.1: Wholesale Request Queue & Customer Upgrades**
  - `GET /api/v1/admin/wholesale-applications`: Paginated list of applications filtered by status (`PENDING`, `APPROVED`, `REJECTED`).
  - `POST /api/v1/admin/wholesale-applications/{id}/approve`:
    - Updates application: `status = APPROVED`, `reviewedBy = adminId`, `reviewedAt = now()`.
    - **Atomically updates target `User.customerType = WHOLESALE`**.
  - `POST /api/v1/admin/wholesale-applications/{id}/reject`:
    - Updates application: `status = REJECTED`, records `adminNotes`. User remains `RETAIL`.
- [ ] **Task 4.2: User Account Administration**
  - `GET /api/v1/admin/users`: Search all users with filters by role and status.
  - `PATCH /api/v1/admin/users/{id}/toggle-active`: Activate or deactivate user accounts (deactivated users cannot authenticate).
  - `PATCH /api/v1/admin/users/{id}/change-role`: Assign staff roles (`CASHIER`, `STOCK_CONTROLLER`).
- [ ] **Task 4.3: Centralized Audit Trail & Transaction Query Engine**
  - `GET /api/v1/admin/audit/inventory-transactions`:
    - Queries `InventoryTransaction` joined with `ProductBatch`, `Product`, and `User`.
    - Filterable by transaction type (`STOCK_IN`, `ONLINE_SALE`, `POS_SALE`, `MANUAL_ADJUSTMENT`, `EXPIRED_WRITE_OFF`) and date range.
- [ ] **Task 4.4: Executive HUD Analytics & Dashboard**
  - `GET /api/v1/admin/dashboard/kpi-summary`:
    - **Gross Revenue:** Total revenue aggregated across both `channel = ONLINE` and `channel = POS`.
    - **Channel Comparison:** Total orders and revenue split (Online vs. Walk-In POS).
    - **Inventory Health:** Active batches count, expired batches count (`isExpired = true`), and low-stock count.
    - **Wholesale Queue Counter:** Count of unreviewed applications.
  - `GET /api/v1/admin/dashboard/sales-series`: Daily/weekly sales charts.

---

## 7. Cross-Role Integration Contracts & Anti-Conflict Rules

To prevent merge conflicts and blockers, developers communicate through **2 Java Interfaces** defined in `com.retail.store.common.contract`:

### Contract 1: Batch Allocation Service (Implemented by Person 3, Consumed by Person 1 & 2)
```java
package com.retail.store.common.contract;

public interface BatchAllocationService {
    List<OrderItemBatchFulfillmentDto> allocateAndDeductBatches(
        Long orderItemId, Long productId, int requestedQty, Long actorUserId, TransactionType type
    );
    int getAvailableStock(Long productId);
    void restoreStockForOrderItem(Long orderItemId, Long actorUserId);
}
```

### Contract 2: Product Price Lookup (Implemented by Person 3, Consumed by Person 1 & 2)
```java
package com.retail.store.common.contract;

public interface ProductCatalogLookup {
    ProductPriceDto getPrices(Long productId);
    boolean isProductAvailable(Long productId);
}
```

---

## 8. Database Migration Plan (Flyway / Liquibase)

Schema files are strictly numbered and isolated by Person index:

```
src/main/resources/db/migration/
├── V1_0__person1_users_and_cart.sql
│   └── Tables: users, roles, cart_items
│
├── V2_0__person2_pos_orders.sql
│   └── Schema additions for POS sales channel
│
├── V3_0__person3_catalog_batches_and_inventory.sql
│   └── Tables: categories, suppliers, products, product_batches, 
│               inventory_transactions, order_item_batch_fulfillments
│
├── V4_0__person4_wholesale_and_orders.sql
│   └── Tables: wholesale_applications, orders, order_items
│
└── V5_0__initial_seeds.sql
    └── Seed roles (USER, CASHIER, STOCK_CONTROLLER, ADMIN) and default admin account
```

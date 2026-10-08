# 🍎 iOS 27 Black & White Aesthetic — Frontend Task Division (Team of 4)
### *1 Person = 1 Role & UI (Complete End-to-End User Experience)*
### *React 18/19, TypeScript, Vite — Port 3000*

> **Document Version:** 3.0.0 (Role & UI Dedicated Architecture)  
> **Visual Style:** **iOS 27 Vision Glass — Ultra-Minimalist Monochromatic Black & White**  
> **Color System:** OLED Pitch Black (`#000000`), Frosted Glass Acrylic (`backdrop-filter: blur(28px) saturate(190%)`), Titanium Gray (`#71717a`), Crisp Stark White (`#ffffff`), 1px Translucent Borders (`rgba(255,255,255,0.12)`)  
> **Motion & Haptics:** Framer Motion Spring Physics, Sliding Segmented Controls, Dynamic Island Capsules  
> **Target Run Port:** `http://localhost:3000`

---

## 📌 Table of Contents
1. [Team Role & UI Assignment Matrix](#1-team-role--ui-assignment-matrix)
2. [iOS 27 Black & White Design Language & Tokens](#2-ios-27-black--white-design-language--tokens)
3. [Zero-Conflict Directory Architecture & Feature Isolation](#3-zero-conflict-directory-architecture--feature-isolation)
4. [Person 1: USER UI Lead (Storefront, Cart & Customer Journey)](#4-person-1-user-ui-lead-storefront-cart--customer-journey)
5. [Person 2: CASHIER UI Lead (Touchscreen POS & Thermal Receipt Engine)](#5-person-2-cashier-ui-lead-touchscreen-pos--thermal-receipt-engine)
6. [Person 3: STOCK_CONTROLLER UI Lead (Cataloging, Stock-In & FIFO/FEFO Radar)](#6-person-3-stock_controller-ui-lead-cataloging-stock-in--fifofefo-radar)
7. [Person 4: ADMIN UI Lead (Executive HUD, Wholesale Review & User Governance)](#7-person-4-admin-ui-lead-executive-hud-wholesale-review--user-governance)
8. [Zustand State Isolation (1 Store per Role)](#8-zustand-state-isolation-1-store-per-role)
9. [Integration & Mocking Protocol](#9-integration--mocking-protocol)

---

## 1. Team Role & UI Assignment Matrix

Each developer is dedicated to **one system role** and owns their entire user interface from end to end:

| Team Member | System Role | Dedicated UI Space | Primary Screens & Features Owned | Dedicated Route Prefix |
| :--- | :--- | :--- | :--- | :--- |
| **Person 1** | **`USER`** | **Online Customer Storefront** | • Customer Login & Register<br>• iOS Glass Catalog & Live Search<br>• Dual Pricing UI (Retail vs. Wholesale tags)<br>• Slide-over Frosted Cart Drawer<br>• 3-Step Checkout with "Slide to Pay"<br>• Order Tracking Stepper & Cancel Modal<br>• Wholesale Application Wizard & Status Badge | `/shop`<br>`/cart`<br>`/checkout`<br>`/orders`<br>`/wholesale-apply` |
| **Person 2** | **`CASHIER`** | **Touchscreen Point of Sale** | • Cashier Staff PIN / Auth Screen<br>• High-Efficiency Split-Screen POS Terminal<br>• Barcode Scanner Input with Auto-Focus<br>• Rapid Tap-to-Add Item Grid<br>• **Strict Retail Price Lock** (No wholesale in POS)<br>• Touch Keypad & Real-Time Change Calculator<br>• Authentic 80mm Monochromatic Thermal Receipt (Printable)<br>• Shift Cash Float Open/Close Modal | `/pos`<br>`/pos/shift`<br>`/pos/receipt` |
| **Person 3** | **`STOCK_CONTROLLER`** | **Inventory & Warehouse Hub** | • Product Cataloging (3 Pricing Tiers + Perishable toggle)<br>• Supplier Profiles & Category Manager<br>• Stock-In Batch Ingestion Sheet<br>• **Visual FIFO / FEFO Batch Expiry Radar**<br>• Real-Time Expiry Status (Healthy, Soon, Expired/Locked)<br>• Low-Stock Threshold Alert Center | `/stock`<br>`/stock/catalog`<br>`/stock/batches`<br>`/stock/suppliers` |
| **Person 4** | **`ADMIN`** | **Executive Governance Portal** | • Executive HUD Dashboard (4 Frosted Glass KPI Cards)<br>• Monochromatic Sales & Revenue Trend Chart<br>• Wholesale Verification Inspection Drawer<br>• One-Click Approve / Reject with Admin Notes<br>• User Management Directory with Activate/Deactivate Switches<br>• System Audit Log Stream | `/admin`<br>`/admin/dashboard`<br>`/admin/wholesale`<br>`/admin/users`<br>`/admin/audit` |

---

## 2. iOS 27 Black & White Design Language & Tokens

The interface is inspired by high-end luxury minimalism: OLED pitch blacks, deep frosted glass materials, and pure stark white typography.

```
       ┌────────────────────────────────────────────────────────┐
       │   [ 12:45 ]        ● (Dynamic Island Capsule)     [ 98% ]│
       ├────────────────────────────────────────────────────────┤
       │                                                        │
       │    ┌──────────────────────────────────────────────┐    │
       │    │  FROSTED ACRYLIC CARD (Blur 28px)            │    │
       │    │  Border: 1px solid rgba(255,255,255,0.12)    │    │
       │    │  Background: rgba(18, 18, 20, 0.65)          │    │
       │    │                                              │    │
       │    │  [ Primary Action ] (Solid Pure White #FFF)  │    │
       │    │  [ Ghost Capsule ]  (Translucent Glass)      │    │
       │    └──────────────────────────────────────────────┘    │
       │                                                        │
       ├────────────────────────────────────────────────────────┤
       │        (   (  FLOATING GLASS BOTTOM DOCK  )   )        │
       └────────────────────────────────────────────────────────┘
```

### Color & Material Tokens (`src/styles/ios27-tokens.css`)
```css
:root {
  --ios-bg-base: #000000;
  --ios-surface-glass-1: rgba(18, 18, 20, 0.75);
  --ios-surface-glass-2: rgba(28, 28, 32, 0.60);
  --ios-glass-border: rgba(255, 255, 255, 0.12);
  --ios-glass-glow: 0 0 25px rgba(255, 255, 255, 0.12);
  --ios-text-white: #FFFFFF;
  --ios-text-muted: #A1A1AA;
  --ios-text-dark: #71717A;
  --ios-text-inverse: #000000;
  --ios-blur: blur(28px) saturate(190%);
  --ios-radius-capsule: 9999px;
  --ios-radius-card: 24px;
  --ios-radius-button: 16px;
}
```

---

## 3. Zero-Conflict Directory Architecture & Feature Isolation

Each developer operates strictly within their assigned feature folder and state slice:

```
backend/src/main/resources/templates/
├── package.json                 <-- Configured with Port 3000
├── vite.config.ts               <-- OutDir configured to ../static
├── index.html
└── src/
    ├── components/
    │   ├── layout/                  <-- AppShell, DynamicIsland, BottomDock, RoleGuard
    │   └── ui/                      <-- Base iOS 27 Atomic UI Kit (Dev 1 coordinates base)
    │       ├── IosButton.tsx
    │       ├── IosCardGlass.tsx
    │       ├── IosInput.tsx
    │       ├── IosSegmentedControl.tsx
    │       ├── IosBottomSheet.tsx
    │       ├── IosBadge.tsx
    │       └── IosToggle.tsx
    │
    ├── features/
    │   ├── customer/                <-- PERSON 1 EXCLUSIVE (USER Role UI)
    │   │   ├── pages/ (CatalogPage, ProductDetailPage, CartDrawer, CheckoutPage, OrderTrackingPage)
    │   │   ├── components/ (ProductCard, DualPriceTag, CheckoutStepper, WholesaleApplyModal)
    │   │   └── services/ (customerApi.ts)
    │   │
    │   ├── pos/                     <-- PERSON 2 EXCLUSIVE (CASHIER Role UI)
    │   │   ├── pages/ (PosTerminalPage, CashierShiftPage)
    │   │   ├── components/ (BarcodeHeader, RapidGrid, PaymentModal, ThermalReceiptModal)
    │   │   └── services/ (posApi.ts)
    │   │
    │   ├── inventory/               <-- PERSON 3 EXCLUSIVE (STOCK_CONTROLLER Role UI)
    │   │   ├── pages/ (StockCatalogPage, BatchIntakePage, SupplierDirectoryPage)
    │   │   ├── components/ (BatchExpiryRadar, StockInModal, LowStockAlertBanner)
    │   │   └── services/ (inventoryApi.ts)
    │   │
    │   └── admin/                   <-- PERSON 4 EXCLUSIVE (ADMIN Role UI)
    │       ├── pages/ (ExecutiveDashboardPage, WholesaleReviewPage, UserGovernancePage)
    │       ├── components/ (KpiGlassCard, WholesaleInspectDrawer, UserStatusToggleTable)
    │       └── services/ (adminApi.ts)
    │
    ├── store/                       <-- 4 Isolated Zustand Stores (1 per Person)
    │   ├── useCustomerStore.ts      <-- Person 1
    │   ├── usePosStore.ts           <-- Person 2
    │   ├── useInventoryStore.ts     <-- Person 3
    │   └── useAdminStore.ts         <-- Person 4
    │
    ├── types/schema.ts              <-- Shared ERD TypeScript Models
    └── App.tsx                      <-- Port 3000 Router
```

---

## 4. Person 1: USER UI Lead (Storefront, Cart & Customer Journey)

### 4.1 Mission & Persona
Person 1 designs the digital shopping experience for retail customers and approved wholesale clients. Emphasizes visual elegance, dual-tier pricing clarity, smooth sliding cart interactions, and live order tracking.

### 4.2 Key UI Deliverables & Actionable Checklist
- [ ] **Task 1.1: Shared UI Library & Customer Layout Shell**
  - Establish base iOS 27 component kit (`IosCardGlass`, `IosButton`, `IosInput`, `IosBadge`, `IosBottomSheet`).
  - Implement top `DynamicIsland.tsx` capsule showing real-time feedback (e.g., *"Item added to cart"*, *"Order confirmed"*).
  - Implement customer authentication screens (`CustomerLoginPage`, `CustomerRegisterPage`).
- [ ] **Task 1.2: Customer Storefront & Product Discovery (`CatalogPage.tsx`)**
  - Frosted glass hero banner showcasing featured goods.
  - Category selector using iOS segmented pills (`IosSegmentedControl`).
  - Instant `⌘K` search bar with real-time filtering.
  - `ProductCard.tsx`:
    - High-contrast visual layout with stock availability badges.
    - **Dual-Pricing Logic:**
      - If `user.customerType === 'WHOLESALE'`: Displays `wholesalePrice` as prominent white text with glowing `WHOLESALE TIER` badge; strikes through `retailPrice`.
      - If `user.customerType === 'RETAIL'`: Displays `retailPrice` with a subtle hint: *"Apply for wholesale pricing to unlock bulk discounts"*.
- [ ] **Task 1.3: Product Detail Sheet (`ProductDetailPage.tsx`)**
  - Slide-up bottom sheet with product specifications, imagery, perishable badge (`isPerishable`), and interactive quantity selector.
- [ ] **Task 1.4: Slide-Over Frosted Cart Drawer (`CartDrawer.tsx`)**
  - Floating cart capsule in bottom dock displaying item count.
  - Slide-out glass drawer: quantity steppers, swipe-to-delete, subtotal, tax calculation, and pricing tier breakdown.
- [ ] **Task 1.5: 3-Stage Checkout Page (`CheckoutPage.tsx`)**
  - Stage 1: Shipping address (auto-filled or editable).
  - Stage 2: Payment method selector (`CARD`, `BANK_TRANSFER`, `CASH`).
  - Stage 3: Order confirmation with iOS "Slide to Confirm Order" slider.
- [ ] **Task 1.6: Order Tracking & History (`OrderTrackingPage.tsx`)**
  - Vertical glowing stepper timeline (`PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`).
  - Displays batch fulfillment transparency from `OrderItemBatchFulfillment`.
  - "Cancel Order" glass button with instant confirmation sheet.
- [ ] **Task 1.7: Wholesale Qualification Wizard (`WholesaleApplyModal.tsx`)**
  - Form to submit `businessName` and `taxIdOrLicense`.
  - Live status indicator: Displays `PENDING`, `APPROVED` (with celebratory glow), or `REJECTED` (with admin notes).
- [ ] **Task 1.8: Store Slice**
  - Implement `useCustomerStore.ts`: Manages `products`, `cartItems`, `userOrders`, `wholesaleStatus`.

---

## 5. Person 2: CASHIER UI Lead (Touchscreen POS & Thermal Receipt Engine)

### 5.1 Mission & Persona
Person 2 designs the in-store Cashier Point of Sale interface. The UI must be optimized for fast touch input, barcode scanning, instant checkout, and strictly locked to Retail Pricing.

### 5.2 Key UI Deliverables & Actionable Checklist
- [ ] **Task 2.1: Cashier Staff PIN Login Screen (`CashierLoginPage.tsx`)**
  - Clean numeric PIN keypad screen for quick cashier shift sign-in.
- [ ] **Task 2.2: POS Touchscreen Terminal (`PosTerminalPage.tsx`)**
  - High-density split screen:
    - **Left Section (65%):**
      - Barcode Scanner input box with auto-focus (searches SKU or Barcode).
      - Category filter pills.
      - Rapid-add product grid with high-contrast cards for instant tap-to-add.
    - **Right Section (35%):**
      - Live walk-in ticket panel showing added items, quantities, and line item subtotals.
      - Giant total display with subtotal, tax amount, and grand total.
- [ ] **Task 2.3: Strict Retail Price Lock (Business Rule Enforcement)**
  - POS ticket explicitly loads `product.retailPrice` for all items.
  - Wholesale pricing logic is **strictly blocked and hidden** in the POS terminal interface.
- [ ] **Task 2.4: Rapid Payment & Change Calculator Modal (`PaymentModal.tsx`)**
  - Denomination quick-tap buttons: $10, $20, $50, $100, and "Exact Cash".
  - On-screen touch keypad for entering custom tendered cash amount.
  - Real-time **Change Calculator**: Displays large white change balance (`Change: $XX.XX`).
  - Card swipe/tap simulation and QR pay prompt.
- [ ] **Task 2.5: 80mm Monochromatic Thermal Receipt Generator (`ThermalReceiptModal.tsx`)**
  - Authentic thermal receipt rendering:
    - Jagged paper-cut edge styling at top and bottom.
    - Store header, Cashier Name, Terminal ID, Sequential Receipt Number (`RCP-POS-XXXX`), and DateTime.
    - Dotted separator lines.
    - Itemized breakdown (Qty, Product Name, Retail Unit Price, Subtotal).
    - Summary: Subtotal, Tax Amount, Total Amount, Tendered Amount, Change Given.
    - Barcode / QR Graphic at bottom.
  - Native print button triggering `window.print()` with `@media print` CSS.
- [ ] **Task 2.6: Cashier Shift Float Management (`CashierShiftPage.tsx`)**
  - Open Shift modal: Enter opening cash float.
  - Close Shift modal: Enter closing cash float, view shift reconciliation totals (total cash, total card sales, variance).
- [ ] **Task 2.7: Store Slice**
  - Implement `usePosStore.ts`: Manages `posTicket`, `tenderedAmount`, `changeDue`, `activeShift`.

---

## 6. Person 3: STOCK_CONTROLLER UI Lead (Cataloging, Stock-In & FIFO/FEFO Radar)

### 6.1 Mission & Persona
Person 3 designs the back-office warehouse and catalog management hub. The UI must provide complete visibility into stock batches, expiry countdowns, FIFO/FEFO dispatch order, and supplier relationships.

### 6.2 Key UI Deliverables & Actionable Checklist
- [ ] **Task 3.1: Product Cataloging Management (`StockCatalogPage.tsx`)**
  - Table of all products with search, category filtering, and stock counts.
  - Product Create/Edit Modal:
    - Basic details: `categoryId`, `sku`, `name`, `description`, `imageUrl`.
    - 3 Pricing Tiers: `costPrice`, `retailPrice`, `wholesalePrice`.
    - Configuration: `minStockThreshold` (default 10) and `isPerishable` toggle switch.
  - Soft-delete toggle: Sets `isDeleted = true` with visual struck-through indicator.
- [ ] **Task 3.2: Stock-In Batch Intake Sheet (`BatchIntakePage.tsx`)**
  - Stock-In Ingestion Form:
    - Product selector.
    - Supplier selector (from `Supplier` table).
    - Batch code auto-generator / manual input (`batchCode`).
    - Initial quantity input (`initialQuantity`).
    - Expiry date picker (`expiryDate`) — mandatory if product is perishable.
- [ ] **Task 3.3: FIFO & FEFO Batch Expiry Radar (`BatchExpiryRadar.tsx`)**
  - Visual timeline of active batches per product:
    - Displays strategy badge: **FEFO** (sorted by expiry) for perishable products; **FIFO** (sorted by received date) for non-perishable goods.
    - Expiry status pill:
      - `ACTIVE` (Healthy batch).
      - `EXPIRING SOON` (Within 7 days).
      - `LOCKED - EXPIRED` (Blocked from sale).
- [ ] **Task 3.4: Low-Stock Alert Center (`LowStockAlertBanner.tsx`)**
  - Highlights products where total active batch stock is below `minStockThreshold`.
  - One-click shortcut to launch the Stock-In modal for that product.
- [ ] **Task 3.5: Supplier Management & Audit Ledger (`SupplierDirectoryPage.tsx`)**
  - Supplier directory with contact person, phone, email, and shipment history.
  - Immutable inventory transaction log viewer (`InventoryTransaction`): filter by type (`STOCK_IN`, `ONLINE_SALE`, `POS_SALE`, `MANUAL_ADJUSTMENT`).
- [ ] **Task 3.6: Store Slice**
  - Implement `useInventoryStore.ts`: Manages `products`, `batches`, `suppliers`, `lowStockAlerts`.

---

## 7. Person 4: ADMIN UI Lead (Executive HUD, Wholesale Review & User Governance)

### 7.1 Mission & Persona
Person 4 designs the executive control suite for business administrators. The UI provides high-level revenue intelligence, user account controls, and the decision engine for approving wholesale applications.

### 7.2 Key UI Deliverables & Actionable Checklist
- [ ] **Task 4.1: Executive HUD Dashboard (`ExecutiveDashboardPage.tsx`)**
  - 4 Frosted Glass KPI metric cards:
    - **Total Revenue:** Aggregated gross sales from both `channel = ONLINE` and `channel = POS`.
    - **Sales Channel Ratio:** Donut/bar breakdown comparing Online vs. Walk-In POS orders.
    - **Pending Wholesale Queue:** Glowing badge showing count of unapproved applications.
    - **Inventory Health Radar:** Count of products below `minStockThreshold` and expired batches.
  - Monochromatic Revenue Chart: Line/area chart with pure white glowing stroke and translucent fill.
- [ ] **Task 4.2: Wholesale Application Review Queue (`WholesaleReviewPage.tsx`)**
  - Table of pending business customer applications.
  - **Inspection Drawer (`WholesaleInspectDrawer.tsx`):**
    - View company name, tax ID/license number, user email, and registration date.
    - Action buttons:
      - **"Approve Application"**: Prompts confirmation; triggers backend upgrade of `user.customerType = WHOLESALE`.
      - **"Reject Application"**: Opens bottom sheet to input required `adminNotes` rejection reason.
- [ ] **Task 4.3: User Governance & Directory (`UserGovernancePage.tsx`)**
  - Table of all users from `User` entity.
  - Quick filters: `ALL`, `USER`, `CASHIER`, `STOCK_CONTROLLER`, `ADMIN`.
  - Toggle switch to immediately activate or deactivate accounts (`isActive`).
  - Role management modal to grant `CASHIER` or `STOCK_CONTROLLER` roles.
- [ ] **Task 4.4: System Activity & Audit Trail Stream (`AuditLogPage.tsx`)**
  - Real-time stream of system actions: admin approvals, stock write-offs, and order cancellations.
- [ ] **Task 4.5: Store Slice**
  - Implement `useAdminStore.ts`: Manages `kpis`, `wholesaleApplications`, `usersList`, `systemLogs`.

---

## 8. Zustand State Isolation (1 Store per Role)

Each developer maintains an isolated Zustand store file in `src/store/`:

```
src/store/
├── useCustomerStore.ts   <-- Owned by Person 1 (Cart, catalog, online orders)
├── usePosStore.ts        <-- Owned by Person 2 (POS ticket, cash float, last receipt)
├── useInventoryStore.ts  <-- Owned by Person 3 (Products, batches, suppliers, alerts)
└── useAdminStore.ts      <-- Owned by Person 4 (KPIs, wholesale queue, user directory)
```

### Shared Auth Store & Route Guards
- `src/store/useAuthStore.ts` stores the logged-in user profile, JWT token, and active role.
- `RoleGuard.tsx` enforces that:
  - Only `USER` can access `/shop`, `/cart`, `/checkout`.
  - Only `CASHIER` can access `/pos`.
  - Only `STOCK_CONTROLLER` can access `/stock`.
  - Only `ADMIN` can access `/admin`.

---

## 9. Integration & Mocking Protocol

### Independent Development with Mock Services
To work simultaneously without waiting for backend APIs, each developer maintains mock data in their feature directory:
- Person 1: `src/features/customer/mocks/mockCustomerData.ts`
- Person 2: `src/features/pos/mocks/mockPosData.ts`
- Person 3: `src/features/inventory/mocks/mockInventoryData.ts`
- Person 4: `src/features/admin/mocks/mockAdminData.ts`

### Dev Server Command
The application runs on port 3000:
```bash
npm run dev -- --port 3000
```

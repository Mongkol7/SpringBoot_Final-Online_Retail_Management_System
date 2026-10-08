# 🌟 Online Retail Management System — Architecture & Team Guide

> **Target Database:** PostgreSQL 18 (`E-bookstrore_db`, password: `123`)  
> **Backend:** Spring Boot 3.x, Spring Data JPA, Spring Security 6 (JWT + BCrypt) — Port 8080  
> **Frontend:** React 18/19, TypeScript, Vite — **iOS 27 Vision Glass (Black & White)** — Port 3000  
> **Frontend Location:** Integrated directly inside `backend/src/main/resources/templates/`  
> **Team Division:** **1 Person per Role & UI**

---

## 👥 Team Assignment Directory Map

| Team Member | System Role | Backend Java Package | Frontend UI Directory (`templates/src/features/`) | Primary Route |
| :--- | :--- | :--- | :--- | :--- |
| **Person 1** | **`USER`** | `backend/src/main/java/com/retail/store/customer/` | `backend/src/main/resources/templates/src/features/customer/` | `/shop`, `/cart`, `/checkout`, `/orders` |
| **Person 2** | **`CASHIER`** | `backend/src/main/java/com/retail/store/cashier/` | `backend/src/main/resources/templates/src/features/pos/` | `/pos`, `/pos/shift`, `/pos/receipt` |
| **Person 3** | **`STOCK_CONTROLLER`** | `backend/src/main/java/com/retail/store/inventory/` | `backend/src/main/resources/templates/src/features/inventory/` | `/stock`, `/stock/batches`, `/stock/catalog` |
| **Person 4** | **`ADMIN`** | `backend/src/main/java/com/retail/store/admin/` | `backend/src/main/resources/templates/src/features/admin/` | `/admin`, `/admin/wholesale`, `/admin/users` |

---

## 📁 Repository Directory Structure

```
SpringBoot_Final/
├── README.md                             <-- Setup guide & team directory map
├── TEAM_TASK_DIVISION_BACKEND_SYSTEM.md  <-- Complete System & Spring Boot Task Guide
├── FRONTEND_REACT_IOS27_TASK_DIVISION.md <-- Frontend React iOS 27 B&W Design Guide
│
└── backend/                              <-- Unified Spring Boot Project
    ├── pom.xml
    └── src/
        ├── main/
        │   ├── java/com/retail/store/
        │   │   ├── RetailApplication.java
        │   │   ├── common/              <-- Shared DTOs, Exception Handlers & Contracts
        │   │   │   └── contract/BatchAllocationService.java
        │   │   ├── security/            <-- Spring Security, JWT & UserDetails
        │   │   ├── customer/            <-- PERSON 1: Cart, Online Orders, Wholesale Apply
        │   │   ├── cashier/             <-- PERSON 2: In-Store POS Walk-in Sale & Receipts
        │   │   ├── inventory/           <-- PERSON 3: Products, Batches, FIFO/FEFO Engine
        │   │   └── admin/               <-- PERSON 4: User Mgmt, Wholesale Review & Analytics
        │   │
        │   └── resources/
        │       ├── application.yml      <-- PostgreSQL 18 (E-bookstrore_db)
        │       ├── db/migration/        <-- Flyway Migrations (V1, V2, V3, V4, V5)
        │       │
        │       └── templates/           <-- ⚛️ FRONTEND REACT APP (iOS 27 Vision Glass)
        │           ├── package.json     <-- Vite, React, Framer Motion, Zustand (Port 3000)
        │           ├── vite.config.ts   <-- Configured for Port 3000 & outDir -> ../static
        │           ├── tsconfig.json
        │           ├── index.html
        │           └── src/
        │               ├── types/schema.ts
        │               ├── styles/ios27-tokens.css
        │               ├── components/
        │               │   ├── layout/DynamicIsland.tsx
        │               │   └── ui/ (IosCardGlass, IosButton)
        │               ├── features/
        │               │   ├── customer/   <-- PERSON 1: Storefront, Cart, Checkout
        │               │   ├── pos/        <-- PERSON 2: POS Terminal & Thermal Receipt
        │               │   ├── inventory/  <-- PERSON 3: Stock-In, FIFO/FEFO Radar
        │               │   └── admin/      <-- PERSON 4: Executive HUD & Wholesale Queue
        │               ├── store/          <-- Isolated Zustand stores
        │               ├── App.tsx         <-- Role Preview & Switcher
        │               └── main.tsx
        │
        └── test/
```

---

## 🚀 Running the Project

### 1. Database (PostgreSQL 18)
- Host: `localhost:5432`
- Database: `E-bookstrore_db`
- Password: `123`
- Flyway migrations run automatically upon Spring Boot launch.

### 2. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
*API Base URL:* `http://localhost:8080/api/v1`

### 3. Frontend (React + Vite in templates)
```bash
cd backend/src/main/resources/templates
npm install
npm run dev
```
*Web App URL:* `http://localhost:3000`
"# SpringBoot_Final-Online_Retail_Management_System" 

package com.retail.store.config;

import com.retail.store.entity.*;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DataSeeder ensures all required baseline system roles, users, categories, suppliers,
 * products, and batches exist in the database without ever overriding existing data.
 *
 * Rule: IF data already exists in the database -> DO NOT OVERRIDE, DO NOT UPDATE.
 */
@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(RoleRepository roleRepository,
                      UserRepository userRepository,
                      CategoryRepository categoryRepository,
                      SupplierRepository supplierRepository,
                      ProductRepository productRepository,
                      ProductBatchRepository productBatchRepository,
                      PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.productBatchRepository = productBatchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DataSeeder] Starting DB baseline verification (non-destructive; existing data will NOT be overridden)...");

        seedRoles();
        seedUsers();
        seedCategories();
        seedSuppliers();
        seedProducts();

        log.info("[DataSeeder] DB baseline verification completed successfully.");
    }

    private void seedRoles() {
        List<String> requiredRoles = List.of("USER", "CASHIER", "STOCK_CONTROLLER", "ADMIN");
        for (String roleName : requiredRoles) {
            if (!roleRepository.existsByName(roleName)) {
                Role role = Role.builder().name(roleName).build();
                roleRepository.save(role);
                log.info("[DataSeeder] Inserted missing role: {}", roleName);
            } else {
                log.debug("[DataSeeder] Role already exists in DB, skipping: {}", roleName);
            }
        }
    }

    private void seedUsers() {
        Role adminRole = roleRepository.findByName("ADMIN").orElse(null);
        Role cashierRole = roleRepository.findByName("CASHIER").orElse(null);
        Role stockRole = roleRepository.findByName("STOCK_CONTROLLER").orElse(null);
        Role userRole = roleRepository.findByName("USER").orElse(null);

        // 1. Admin user
        seedUserIfNotExists("admin@retailstore.com", "admin123", "System Administrator",
                "+1-555-0100", adminRole, CustomerType.RETAIL, "1234");

        // 2. Cashier user
        seedUserIfNotExists("cashier@retailstore.com", "cashier123", "POS Lead Cashier",
                "+1-555-0102", cashierRole, CustomerType.RETAIL, "1234");

        // 3. Stock Controller user
        seedUserIfNotExists("stock@retailstore.com", "stock123", "Warehouse Stock Controller",
                "+1-555-0103", stockRole, CustomerType.RETAIL, "1234");

        // 4. Default Store Customer user
        seedUserIfNotExists("customer@retailstore.com", "user123", "Customer",
                "+855 12 849 201", userRole, CustomerType.RETAIL, "1234");
    }

    private void seedUserIfNotExists(String email, String rawPassword, String fullName,
                                     String phone, Role role, CustomerType customerType, String posPin) {
        if (!userRepository.existsByEmail(email)) {
            if (role == null) {
                log.warn("[DataSeeder] Cannot seed user '{}' because role is missing.", email);
                return;
            }
            User user = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .fullName(fullName)
                    .phone(phone)
                    .role(role)
                    .customerType(customerType)
                    .addresses("[\"No. 42, St. 271, Sangkat Boeng Tumpun, Phnom Penh, Cambodia\"]")
                    .isActive(true)
                    .build();
            user.setPosPin(posPin != null ? posPin : "1234");
            userRepository.save(user);
            log.info("[DataSeeder] Inserted missing baseline user: {} ({})", email, role.getName());
        } else {
            log.debug("[DataSeeder] User already exists in DB, skipping override: {}", email);
        }
    }

    private void seedCategories() {
        seedCategoryIfNotExists("Beverages", "Cold brew, artisanal teas, sparkling water, and canned drinks");
        seedCategoryIfNotExists("Snacks", "Energy bars, gourmet crisps, roasted nuts, and confectionery");
        seedCategoryIfNotExists("Dairy & Plant Milk", "Organic whole milk, barista oat milk, almond milk, and yogurt");
        seedCategoryIfNotExists("Nutrition & Supplements", "Whey protein, matcha powders, meal replacements, and vitamins");
    }

    private void seedCategoryIfNotExists(String name, String description) {
        if (!categoryRepository.existsByNameIgnoreCase(name)) {
            Category cat = Category.builder()
                    .name(name)
                    .description(description)
                    .isDeleted(false)
                    .build();
            categoryRepository.save(cat);
            log.info("[DataSeeder] Inserted missing category: {}", name);
        } else {
            log.debug("[DataSeeder] Category already exists in DB, skipping override: {}", name);
        }
    }

    private void seedSuppliers() {
        seedSupplierIfNotExists("Apex Global Beverage Corp", "Marcus Vance",
                "marcus@apexbeverage.com", "+1-555-0321", "742 Evergreen Terrace, Springfield");
        seedSupplierIfNotExists("Verdant BioFarm Organics", "Elena Rostova",
                "elena@verdantorganics.com", "+1-555-0322", "120 Harvest Way, Portland");
        seedSupplierIfNotExists("Summit Performance Nutrition", "David Sterling",
                "david@summitnutrition.com", "+1-555-0323", "88 Boulder Creek Rd, Denver");
    }

    private void seedSupplierIfNotExists(String name, String contactName, String email, String phone, String address) {
        if (!supplierRepository.existsByName(name)) {
            Supplier sup = Supplier.builder()
                    .name(name)
                    .contactName(contactName)
                    .email(email)
                    .phone(phone)
                    .address(address)
                    .isDeleted(false)
                    .build();
            supplierRepository.save(sup);
            log.info("[DataSeeder] Inserted missing supplier: {}", name);
        } else {
            log.debug("[DataSeeder] Supplier already exists in DB, skipping override: {}", name);
        }
    }

    private void seedProducts() {
        Category snacks = categoryRepository.findAll().stream()
                .filter(c -> "Snacks".equalsIgnoreCase(c.getName()))
                .findFirst().orElse(null);
        Category beverages = categoryRepository.findAll().stream()
                .filter(c -> "Beverages".equalsIgnoreCase(c.getName()))
                .findFirst().orElse(null);
        Category dairy = categoryRepository.findAll().stream()
                .filter(c -> "Dairy & Plant Milk".equalsIgnoreCase(c.getName()))
                .findFirst().orElse(null);
        Supplier apexSupplier = supplierRepository.findAll().stream()
                .filter(s -> "Apex Global Beverage Corp".equalsIgnoreCase(s.getName()))
                .findFirst().orElse(null);

        // Sample product 1
        Product energyBar = seedProductIfNotExists(
                "SKU-ENERGY-BAR",
                "Organic Energy Bar (Almond & Honey)",
                "Raw cold-pressed almond butter with wildflower honey and sprouted quinoa flakes.",
                "https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=400&q=80",
                new BigDecimal("1.80"),
                new BigDecimal("2.50"),
                new BigDecimal("3.50"),
                snacks,
                10,
                true
        );

        // Sample product 2
        Product coldBrew = seedProductIfNotExists(
                "SKU-COLD-BREW",
                "Artisan Cold Brew Coffee 330ml",
                "Steeped for 20 hours with Ethiopian single-origin beans. Smooth and citrusy.",
                "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80",
                new BigDecimal("2.20"),
                new BigDecimal("3.20"),
                new BigDecimal("4.75"),
                beverages,
                10,
                true
        );

        // Sample product 3
        Product oatMilk = seedProductIfNotExists(
                "SKU-OAT-MILK-1L",
                "Barista Blend Oat Milk 1L",
                "Foamable oat drink formulated for specialty lattes and flat whites.",
                "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
                new BigDecimal("2.10"),
                new BigDecimal("3.10"),
                new BigDecimal("4.50"),
                dairy,
                12,
                true
        );

        // Check and seed initial batches if missing (DO NOT OVERRIDE existing)
        if (energyBar != null && apexSupplier != null) {
            seedBatchIfNotExists("BAT-EB-FRESH-01", energyBar, apexSupplier, 100, 100, LocalDate.now().plusMonths(6));
        }
        if (coldBrew != null && apexSupplier != null) {
            seedBatchIfNotExists("BAT-CB-FRESH-01", coldBrew, apexSupplier, 80, 80, LocalDate.now().plusMonths(4));
        }
        if (oatMilk != null && apexSupplier != null) {
            seedBatchIfNotExists("BAT-OM-FRESH-01", oatMilk, apexSupplier, 60, 60, LocalDate.now().plusMonths(5));
        }
    }

    private Product seedProductIfNotExists(String sku, String name, String description, String imageUrl,
                                          BigDecimal costPrice, BigDecimal wholesalePrice, BigDecimal retailPrice,
                                          Category category, int minStock, boolean isPerishable) {
        if (!productRepository.existsBySku(sku)) {
            if (category == null) {
                log.warn("[DataSeeder] Cannot seed product '{}' because category is missing.", sku);
                return null;
            }
            Product prod = Product.builder()
                    .sku(sku)
                    .name(name)
                    .description(description)
                    .imageUrl(imageUrl)
                    .costPrice(costPrice)
                    .wholesalePrice(wholesalePrice)
                    .retailPrice(retailPrice)
                    .category(category)
                    .minStockThreshold(minStock)
                    .isPerishable(isPerishable)
                    .isDeleted(false)
                    .build();
            Product saved = productRepository.save(prod);
            log.info("[DataSeeder] Inserted missing product: {} (SKU: {})", name, sku);
            return saved;
        } else {
            log.debug("[DataSeeder] Product already exists in DB, skipping override: {}", sku);
            return productRepository.findAll().stream()
                    .filter(p -> sku.equalsIgnoreCase(p.getSku()) && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .findFirst().orElse(null);
        }
    }

    private void seedBatchIfNotExists(String batchCode, Product product, Supplier supplier,
                                     int initialQty, int currentQty, LocalDate expiryDate) {
        if (!productBatchRepository.existsByBatchCode(batchCode)) {
            ProductBatch batch = ProductBatch.builder()
                    .batchCode(batchCode)
                    .product(product)
                    .supplier(supplier)
                    .initialQuantity(initialQty)
                    .currentQuantity(currentQty)
                    .expiryDate(expiryDate)
                    .isExpired(false)
                    .build();
            productBatchRepository.save(batch);
            log.info("[DataSeeder] Inserted missing product batch: {}", batchCode);
        } else {
            log.debug("[DataSeeder] ProductBatch already exists in DB, skipping override: {}", batchCode);
        }
    }
}

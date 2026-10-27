package com.retail.store.config;

import com.retail.store.entity.*;
import com.retail.store.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataSeederTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductBatchRepository productBatchRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataSeeder dataSeeder;

    @Test
    @DisplayName("DataSeeder: When data already exists in DB, do NOT override or overwrite it")
    void testDataSeeder_WhenDataAlreadyExists_DoesNotOverride() {
        // Given: All entities already exist in DB
        when(roleRepository.existsByName(anyString())).thenReturn(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        when(categoryRepository.existsByNameIgnoreCase(anyString())).thenReturn(true);
        when(supplierRepository.existsByName(anyString())).thenReturn(true);
        when(productRepository.existsBySku(anyString())).thenReturn(true);
        when(productBatchRepository.existsByBatchCode(anyString())).thenReturn(true);

        // When: Seeder runs
        dataSeeder.run();

        // Then: Zero saves for users, categories, suppliers, products, batches
        verify(userRepository, never()).save(any(User.class));
        verify(categoryRepository, never()).save(any(Category.class));
        verify(supplierRepository, never()).save(any(Supplier.class));
        verify(productRepository, never()).save(any(Product.class));
        verify(productBatchRepository, never()).save(any(ProductBatch.class));
    }

    @Test
    @DisplayName("DataSeeder: When baseline records are missing, inserts them cleanly")
    void testDataSeeder_WhenRecordsMissing_InsertsCleanly() {
        // Given: None exist
        when(roleRepository.existsByName(anyString())).thenReturn(false);
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(Role.builder().id(1).name("ADMIN").build()));
        when(roleRepository.findByName("CASHIER")).thenReturn(Optional.of(Role.builder().id(2).name("CASHIER").build()));
        when(roleRepository.findByName("STOCK_CONTROLLER")).thenReturn(Optional.of(Role.builder().id(3).name("STOCK_CONTROLLER").build()));
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(Role.builder().id(4).name("USER").build()));

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        when(categoryRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(supplierRepository.existsByName(anyString())).thenReturn(false);
        when(productRepository.existsBySku(anyString())).thenReturn(false);

        // When: Seeder runs
        dataSeeder.run();

        // Then: Missing records are created and saved
        verify(roleRepository, atLeast(4)).save(any(Role.class));
        verify(userRepository, atLeast(4)).save(any(User.class));
        verify(categoryRepository, atLeast(4)).save(any(Category.class));
        verify(supplierRepository, atLeast(3)).save(any(Supplier.class));
    }
}

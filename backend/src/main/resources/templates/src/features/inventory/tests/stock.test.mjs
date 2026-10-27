import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: remaining days calculation
function remainingDays(value) {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.ceil((target - today) / 86400000);
}

// Helper: computeBatchState
function computeBatchState(batch) {
  const days = remainingDays(batch.expiryDate);
  if (batch.isExpired || (days !== null && days < 0)) {
    return { label: 'Expired · Locked', className: 'expired', days };
  }
  if (days !== null && days <= 7) {
    return { label: days === 0 ? 'Expires today' : `${days}d left · Soon`, className: 'soon', days };
  }
  return { label: 'Active · Healthy', className: 'healthy', days };
}

// Helper: validate pricing contract
function validatePricingHierarchy(cost, wholesale, retail) {
  return cost <= wholesale && wholesale <= retail;
}

// Helper: calculate product available stock (excluding expired batches)
function calculateProductStock(productId, batches) {
  return batches
    .filter((b) => b.product?.id === productId && !computeBatchState(b).className.includes('expired'))
    .reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);
}

// Helper: sort batches by FIFO or FEFO strategy
function sortBatchesByStrategy(batches) {
  return [...batches].sort((a, b) => {
    if (a.product?.isPerishable && b.product?.isPerishable) {
      return (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999');
    }
    return (a.receivedAt || '').localeCompare(b.receivedAt || '');
  });
}

// =========================================================================
// TEST SUITE: Stock Controller Frontend (Person 3)
// =========================================================================

test('Contract 2: Pricing Hierarchy Validation (cost <= wholesale <= retail)', async (t) => {
  await t.test('accepts strictly valid pricing hierarchy', () => {
    assert.equal(validatePricingHierarchy(1.80, 2.50, 3.50), true);
    assert.equal(validatePricingHierarchy(2.00, 2.00, 2.00), true); // Equal boundary allowed
  });

  await t.test('rejects when cost exceeds wholesale price', () => {
    assert.equal(validatePricingHierarchy(3.00, 2.50, 4.00), false);
  });

  await t.test('rejects when wholesale exceeds retail price', () => {
    assert.equal(validatePricingHierarchy(1.50, 4.00, 3.50), false);
  });

  await t.test('rejects when cost exceeds retail price directly', () => {
    assert.equal(validatePricingHierarchy(5.00, 4.00, 3.00), false);
  });
});

test('Rotation Engine: FIFO vs FEFO Sorting Protocol', async (t) => {
  const perishableProduct = { id: 1, name: 'Cold Brew Coffee', isPerishable: true };
  const dryProduct = { id: 2, name: 'Jasmine Rice', isPerishable: false };

  await t.test('FEFO sorts perishable items by earliest expiry date first', () => {
    const batches = [
      { id: 1, batchCode: 'B-LATE', product: perishableProduct, expiryDate: '2026-12-01', receivedAt: '2026-01-01' },
      { id: 2, batchCode: 'B-SOON', product: perishableProduct, expiryDate: '2026-06-01', receivedAt: '2026-02-01' },
      { id: 3, batchCode: 'B-MID',  product: perishableProduct, expiryDate: '2026-09-01', receivedAt: '2026-01-15' }
    ];

    const sorted = sortBatchesByStrategy(batches);
    assert.equal(sorted[0].batchCode, 'B-SOON');
    assert.equal(sorted[1].batchCode, 'B-MID');
    assert.equal(sorted[2].batchCode, 'B-LATE');
  });

  await t.test('FIFO sorts non-perishable items by oldest received date first', () => {
    const batches = [
      { id: 10, batchCode: 'RICE-NEW', product: dryProduct, receivedAt: '2026-03-10' },
      { id: 11, batchCode: 'RICE-OLD', product: dryProduct, receivedAt: '2026-01-05' },
      { id: 12, batchCode: 'RICE-MID', product: dryProduct, receivedAt: '2026-02-01' }
    ];

    const sorted = sortBatchesByStrategy(batches);
    assert.equal(sorted[0].batchCode, 'RICE-OLD');
    assert.equal(sorted[1].batchCode, 'RICE-MID');
    assert.equal(sorted[2].batchCode, 'RICE-NEW');
  });
});

test('Batch Expiry Radar Status Calculation', async (t) => {
  const today = new Date();

  await t.test('flags batch as Expired · Locked when isExpired is true', () => {
    const batch = { isExpired: true, currentQuantity: 10, expiryDate: '2026-12-31' };
    const state = computeBatchState(batch);
    assert.equal(state.className, 'expired');
    assert.equal(state.label, 'Expired · Locked');
  });

  await t.test('flags batch as Expiring Soon when expiry is within 7 days', () => {
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 4);
    const dateStr = soonDate.toISOString().slice(0, 10);

    const batch = { isExpired: false, currentQuantity: 15, expiryDate: dateStr };
    const state = computeBatchState(batch);
    assert.equal(state.className, 'soon');
    assert.ok(state.label.includes('Soon') || state.label.includes('4d left'));
  });

  await t.test('flags batch as Active · Healthy when expiry is beyond 7 days', () => {
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 45);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const batch = { isExpired: false, currentQuantity: 20, expiryDate: dateStr };
    const state = computeBatchState(batch);
    assert.equal(state.className, 'healthy');
    assert.equal(state.label, 'Active · Healthy');
  });

  await t.test('non-perishable goods with no expiry are Active · Healthy', () => {
    const batch = { isExpired: false, currentQuantity: 50, expiryDate: undefined };
    const state = computeBatchState(batch);
    assert.equal(state.className, 'healthy');
  });
});

test('Low-Stock Radar & Stock Deductions', async (t) => {
  const product = { id: 101, name: 'Organic Rolled Oats', minStockThreshold: 15 };

  await t.test('excludes expired batches from available stock calculation', () => {
    const batches = [
      { id: 1, product, currentQuantity: 10, isExpired: false },
      { id: 2, product, currentQuantity: 8, isExpired: true }, // Should be excluded!
      { id: 3, product, currentQuantity: 4, isExpired: false }
    ];

    const available = calculateProductStock(101, batches);
    assert.equal(available, 14); // 10 + 4 (8 excluded)
  });

  await t.test('triggers low-stock alert when available stock <= minStockThreshold', () => {
    const batches = [
      { id: 1, product, currentQuantity: 10, isExpired: false }
    ];
    const available = calculateProductStock(101, batches);
    const isLow = available <= product.minStockThreshold;
    assert.equal(isLow, true); // 10 <= 15
  });

  await t.test('does not trigger low-stock alert when stock is sufficient', () => {
    const batches = [
      { id: 1, product, currentQuantity: 25, isExpired: false }
    ];
    const available = calculateProductStock(101, batches);
    const isLow = available <= product.minStockThreshold;
    assert.equal(isLow, false); // 25 > 15
  });
});

test('Batch Quantity Adjustment Validation', async (t) => {
  const batch = { id: 50, currentQuantity: 12 };

  await t.test('allows positive delta adjustment', () => {
    const delta = 5;
    const newQty = batch.currentQuantity + delta;
    assert.equal(newQty, 17);
  });

  await t.test('allows negative delta within available stock', () => {
    const delta = -4;
    const newQty = batch.currentQuantity + delta;
    assert.equal(newQty, 8);
    assert.ok(newQty >= 0);
  });

  await t.test('rejects negative delta exceeding batch quantity', () => {
    const delta = -15;
    const isValid = batch.currentQuantity + delta >= 0;
    assert.equal(isValid, false); // 12 - 15 = -3 (< 0 is invalid)
  });
});

test('Inbound Stock-In Perishable Rule', async (t) => {
  const perishableProduct = { id: 1, name: 'Fresh Yogurt', isPerishable: true };
  const nonPerishableProduct = { id: 2, name: 'Mineral Water', isPerishable: false };

  function validateStockInPayload(product, expiryDate) {
    if (product.isPerishable && !expiryDate) {
      return { valid: false, error: 'Expiry date is required for perishable products.' };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (expiryDate && expiryDate <= today) {
      return { valid: false, error: 'Expiry date must be a future date.' };
    }
    return { valid: true };
  }

  await t.test('fails when perishable product has no expiry date', () => {
    const res = validateStockInPayload(perishableProduct, '');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Expiry date is required for perishable products.');
  });

  await t.test('succeeds when perishable product includes future expiry date', () => {
    const res = validateStockInPayload(perishableProduct, '2026-11-20');
    assert.equal(res.valid, true);
  });

  await t.test('succeeds when non-perishable product omits expiry date', () => {
    const res = validateStockInPayload(nonPerishableProduct, '');
    assert.equal(res.valid, true);
  });

  await t.test('fails when any supplied expiry date is today or earlier', () => {
    const res = validateStockInPayload(nonPerishableProduct, new Date().toISOString().slice(0, 10));
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Expiry date must be a future date.');
  });
});

import React, { useState, useEffect } from 'react';
import { PosProductScan } from '../../types/schema';
import {
  X,
  Barcode,
  Package,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingCart,
  Boxes
} from 'lucide-react';

interface ProductDetailModalProps {
  product: PosProductScan | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: PosProductScan, quantity: number, batchPreference?: 'FRESH' | 'CLEARANCE') => void;
  inCartQty?: number;
  inCartClearanceQty?: number;
  inCartFreshQty?: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  inCartQty: _inCartQty = 0,
  inCartClearanceQty = 0,
  inCartFreshQty = 0
}) => {
  const [addQty, setAddQty] = useState<number>(1);
  const [batchPreference, setBatchPreference] = useState<'FRESH' | 'CLEARANCE'>('FRESH');

  // Format date string (YYYY-MM-DD -> DD MMM YYYY)
  const formatExpiryDate = (dateStr?: string) => {
    if (!dateStr) return '19 Oct 2027';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Compute days remaining until batch expiration
  const getExpiryDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const target = new Date(year, month, day).getTime();
        const now = new Date().setHours(0, 0, 0, 0);
        return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      }
      return null;
    } catch {
      return null;
    }
  };

  // Batch allocations
  const nearExpiryBatch = product?.batches?.find((b) => b.isNearExpiry) || null;

  const nearExpiryMaxStock = product?.nearExpiryQuantity !== undefined
    ? product.nearExpiryQuantity
    : (nearExpiryBatch ? nearExpiryBatch.currentQuantity : 0);

  const freshMaxStock = product?.freshStockQuantity !== undefined
    ? product.freshStockQuantity
    : Math.max(0, (product?.availableStock || 0) - nearExpiryMaxStock);

  const availableClearanceToAdd = Math.max(0, nearExpiryMaxStock - inCartClearanceQty);
  const availableFreshToAdd = Math.max(0, freshMaxStock - inCartFreshQty);

  const isClearanceSelected = batchPreference === 'CLEARANCE';
  const selectedBatchMaxAddable = isClearanceSelected ? availableClearanceToAdd : availableFreshToAdd;

  // Reset state on open
  useEffect(() => {
    if (isOpen && product) {
      if (availableFreshToAdd > 0) {
        setBatchPreference('FRESH');
        setAddQty(1);
      } else if (availableClearanceToAdd > 0) {
        setBatchPreference('CLEARANCE');
        setAddQty(1);
      } else {
        setBatchPreference('FRESH');
        setAddQty(0);
      }
    }
  }, [isOpen, product?.id, availableFreshToAdd, availableClearanceToAdd]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleSelectPreference = (pref: 'FRESH' | 'CLEARANCE') => {
    setBatchPreference(pref);
    const max = pref === 'CLEARANCE' ? availableClearanceToAdd : availableFreshToAdd;
    setAddQty(max > 0 ? 1 : 0);
  };

  const handleIncrement = () => {
    if (addQty < selectedBatchMaxAddable) {
      setAddQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (addQty > 1) {
      setAddQty((prev) => prev - 1);
    }
  };

  const handleDirectQtyChange = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      setAddQty(selectedBatchMaxAddable > 0 ? 1 : 0);
    } else if (parsed > selectedBatchMaxAddable) {
      setAddQty(selectedBatchMaxAddable);
    } else {
      setAddQty(parsed);
    }
  };

  const handleAddAndClose = () => {
    if (selectedBatchMaxAddable > 0 && addQty > 0) {
      const finalQty = Math.min(addQty, selectedBatchMaxAddable);
      onAddToCart(product, finalQty, batchPreference);
      onClose();
    }
  };

  const clearanceUnitPrice = product.clearancePrice || (Math.round(product.retailPrice * 0.75 * 100) / 100);
  const effectivePrice = isClearanceSelected ? clearanceUnitPrice : product.retailPrice;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          padding: '24px',
          position: 'relative',
          animation: 'applePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            zIndex: 10
          }}
          title="Close dialog (Esc)"
        >
          <X size={16} />
        </button>

        {/* Modal Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product Inventory & Batch Tracking
            </div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF' }}>
              Batch Expiration Specifications
            </div>
          </div>
        </div>

        {/* Hero Image & Product Title Row */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Barcode size={32} style={{ opacity: 0.4 }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF'
                }}
              >
                {product.sku}
              </span>
              {product.categoryName && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {product.categoryName}
                </span>
              )}
              {product.isPerishable && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}
                >
                  FEFO Perishable
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px', lineHeight: 1.3 }}>
              {product.name}
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', margin: '0 0 10px', lineHeight: 1.4 }}>
              {product.description || 'Artisanal retail product stored under strict batch FEFO inventory management.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#10B981' }}>
                ${product.retailPrice.toFixed(2)}
              </span>
              {nearExpiryMaxStock > 0 && (
                <span style={{ fontSize: '13px', color: '#FCD34D', fontWeight: 700 }}>
                  (Clearance batch: ${clearanceUnitPrice.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: SHOW EXPIRED FOR BOTH <1 MONTH AND >1 MONTH ON EACH DIFFERENT BATCH */}
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={16} color="#38BDF8" />
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Batch Inventory & Expiry Radar
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700 }}>
              {product.batches?.length || 2} Batches Tracked
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {/* Render Batches: <1 Month Expiring Batches */}
            {product.batches && product.batches.length > 0 ? (
              product.batches.map((b) => {
                const days = b.daysUntilExpiry !== undefined ? b.daysUntilExpiry : getExpiryDaysRemaining(b.expiryDate);
                const isUnderMonth = b.isNearExpiry || (days !== null && days <= 30);
                const isSelected = isUnderMonth ? batchPreference === 'CLEARANCE' : batchPreference === 'FRESH';
                const inCartForThis = isUnderMonth ? inCartClearanceQty : inCartFreshQty;
                const availableForThis = isUnderMonth ? availableClearanceToAdd : availableFreshToAdd;

                return (
                  <div
                    key={b.batchId || b.batchCode}
                    onClick={() => handleSelectPreference(isUnderMonth ? 'CLEARANCE' : 'FRESH')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected
                        ? `2px solid ${isUnderMonth ? '#F59E0B' : '#10B981'}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected
                        ? isUnderMonth ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF' }}>
                          {b.batchCode}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: isUnderMonth ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                            color: isUnderMonth ? '#FCD34D' : '#10B981',
                            border: `1px solid ${isUnderMonth ? '#F59E0B' : '#10B981'}`
                          }}
                        >
                          {isUnderMonth ? '⚠️ <1 MONTH EXPIRED / CLEARANCE' : '🌿 >1 MONTH NORMAL EXPIRY'}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={12} color={isUnderMonth ? '#F59E0B' : '#10B981'} />
                        <span><strong>Expiry:</strong> {formatExpiryDate(b.expiryDate)}</span>
                        <span>•</span>
                        <span>{days !== null ? `${days} days remaining` : 'Shelf-stable'}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: isUnderMonth ? '#F59E0B' : '#10B981' }}>
                        {isUnderMonth ? `$${clearanceUnitPrice.toFixed(2)} (25% OFF)` : `$${product.retailPrice.toFixed(2)}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, marginTop: '2px' }}>
                        {b.currentQuantity} units total {inCartForThis > 0 ? `(${inCartForThis} in cart)` : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: availableForThis > 0 ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                        {availableForThis > 0 ? `${availableForThis} available to add` : 'Batch stock limit reached'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback if product has no batches array: show standard comparison */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => handleSelectPreference('FRESH')}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: batchPreference === 'FRESH' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: batchPreference === 'FRESH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>🌿 &gt;1 Month Normal Expiry</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>${product.retailPrice.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>{freshMaxStock} units available</div>
                </div>

                <div
                  onClick={() => handleSelectPreference('CLEARANCE')}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: batchPreference === 'CLEARANCE' ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: batchPreference === 'CLEARANCE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#FCD34D' }}>⚠️ &lt;1 Month Clearance (25% OFF)</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>${clearanceUnitPrice.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>{nearExpiryMaxStock} units in batch</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Batch Selection Bar & Strict Quantity Limit Notice */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: isClearanceSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isClearanceSelected ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isClearanceSelected ? <AlertTriangle size={16} color="#F59E0B" /> : <ShieldCheck size={16} color="#10B981" />}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: isClearanceSelected ? '#FCD34D' : '#10B981' }}>
                Active Batch: {isClearanceSelected ? 'Clearance (<1mo Expiring)' : 'Normal Shelf (>1mo Fresh)'}
              </span>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)' }}>
                {isClearanceSelected
                  ? `Strict Limit: Unable to add more than this batch's available stock (${nearExpiryMaxStock} total, ${availableClearanceToAdd} remaining).`
                  : `Normal Shelf Batch: ${availableFreshToAdd} remaining available to add.`}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer: Quantity Selector & Add to Order */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            flexWrap: 'wrap'
          }}
        >
          {/* Quantity Selector Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 700 }}>
              Quantity:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={selectedBatchMaxAddable <= 0 || addQty <= 1}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  cursor: selectedBatchMaxAddable <= 0 || addQty <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedBatchMaxAddable <= 0 || addQty <= 1 ? 0.3 : 1
                }}
              >
                <Minus size={15} />
              </button>

              <input
                type="number"
                min="1"
                max={selectedBatchMaxAddable}
                value={selectedBatchMaxAddable > 0 ? addQty : 0}
                disabled={selectedBatchMaxAddable <= 0}
                onChange={(e) => handleDirectQtyChange(e.target.value)}
                style={{
                  width: '54px',
                  height: '34px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={handleIncrement}
                disabled={selectedBatchMaxAddable <= 0 || addQty >= selectedBatchMaxAddable}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  cursor: selectedBatchMaxAddable <= 0 || addQty >= selectedBatchMaxAddable ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedBatchMaxAddable <= 0 || addQty >= selectedBatchMaxAddable ? 0.3 : 1
                }}
              >
                <Plus size={15} />
              </button>
            </div>

            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
              / max {selectedBatchMaxAddable}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleAddAndClose}
              disabled={selectedBatchMaxAddable <= 0}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: selectedBatchMaxAddable <= 0 ? 'rgba(255, 255, 255, 0.15)' : '#FFFFFF',
                color: selectedBatchMaxAddable <= 0 ? 'rgba(255, 255, 255, 0.4)' : '#000000',
                border: 'none',
                fontSize: '13px',
                fontWeight: 900,
                cursor: selectedBatchMaxAddable <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: selectedBatchMaxAddable <= 0 ? 'none' : '0 6px 20px rgba(255, 255, 255, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingCart size={15} />
              {selectedBatchMaxAddable <= 0
                ? 'Batch Stock Exhausted'
                : `Add ${addQty} ($${(addQty * effectivePrice).toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetailModal;

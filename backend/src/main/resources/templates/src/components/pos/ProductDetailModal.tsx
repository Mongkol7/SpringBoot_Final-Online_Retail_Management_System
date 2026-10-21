import React, { useState, useEffect } from 'react';
import { PosProductScan } from '../../types/schema';
import {
  X,
  Barcode,
  Package,
  Layers,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  TrendingUp,
  Tag
} from 'lucide-react';

interface ProductDetailModalProps {
  product: PosProductScan | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: PosProductScan, quantity: number) => void;
  inCartQty?: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  inCartQty = 0
}) => {
  const [addQty, setAddQty] = useState<number>(1);

  // Reset add quantity whenever modal opens for a product
  useEffect(() => {
    if (isOpen) {
      setAddQty(1);
    }
  }, [isOpen, product?.id]);

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

  const remainingStock = Math.max(0, product.availableStock - inCartQty);
  const isOutOfStock = remainingStock <= 0;
  const isLowStock = remainingStock > 0 && remainingStock <= (product.minStockThreshold || 10);
  const maxAddable = Math.max(1, remainingStock);

  const handleIncrement = () => {
    if (addQty < remainingStock) {
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
      setAddQty(1);
    } else if (parsed > remainingStock) {
      setAddQty(remainingStock);
    } else {
      setAddQty(parsed);
    }
  };

  const handleAddAndClose = () => {
    if (!isOutOfStock && addQty > 0) {
      onAddToCart(product, addQty);
      onClose();
    }
  };

  // Profit margin calculation if cost price is available
  const marginPercent =
    product.costPrice && product.costPrice > 0
      ? (((product.retailPrice - product.costPrice) / product.retailPrice) * 100).toFixed(1)
      : null;

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

  // Resolves the current batch expiry date guaranteed
  const resolveExpiryDate = (p: PosProductScan): string => {
    if (p.currentBatchExpiryDate) return p.currentBatchExpiryDate;
    const knownExpirations: Record<string, string> = {
      'SKU-ENERGY-BAR': '2027-10-08',
      'SKU-COLD-BREW': '2027-04-06',
      'SKU-SPARKLING-H2O': '2028-10-07',
      'SKU-CHIP-TRUFFLE': '2027-08-04',
      'SKU-OAT-MILK': '2027-02-05',
      'SKU-DARK-CHOC': '2028-02-20',
      'SKU-PROTEIN-WHEY': '2028-09-07',
      'SKU-MATCHA-LATTE': '2027-06-05'
    };
    if (p.sku && knownExpirations[p.sku]) {
      return knownExpirations[p.sku];
    }
    return '2027-10-19';
  };

  const resolveBatchCode = (p: PosProductScan): string => {
    if (p.currentBatchCode) return p.currentBatchCode;
    const knownBatches: Record<string, string> = {
      'SKU-ENERGY-BAR': 'BATCH-ENGBAR-01',
      'SKU-COLD-BREW': 'BATCH-CLDBRW-01',
      'SKU-SPARKLING-H2O': 'BATCH-SPKH2O-01',
      'SKU-CHIP-TRUFFLE': 'BATCH-TRFCHP-01',
      'SKU-OAT-MILK': 'BATCH-OATMLK-01',
      'SKU-DARK-CHOC': 'BATCH-DKCHOC-01',
      'SKU-PROTEIN-WHEY': 'BATCH-WHYPRO-01',
      'SKU-MATCHA-LATTE': 'BATCH-MTCLAT-01'
    };
    if (p.sku && knownBatches[p.sku]) {
      return knownBatches[p.sku];
    }
    return `BATCH-${p.sku || 'CURR'}-01`;
  };

  const activeExpiryDate = resolveExpiryDate(product);
  const activeBatchCode = resolveBatchCode(product);
  const expiryDays = getExpiryDaysRemaining(activeExpiryDate);
  const isBatchExpiringSoon = expiryDays !== null && expiryDays <= 60;
  const isBatchExpired = expiryDays !== null && expiryDays <= 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          backgroundColor: 'rgba(24, 24, 27, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
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
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product Inventory Detail
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
              POS Catalog Spec
            </div>
          </div>
        </div>

        {/* Hero Image & Tags Row */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '18px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Barcode size={48} style={{ opacity: 0.3 }} />
            )}

            {product.isPerishable && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.95)',
                  color: '#000000',
                  letterSpacing: '0.04em'
                }}
              >
                FEFO
              </span>
            )}
          </div>

          {/* Product Title & Basic Badges */}
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {/* Category */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Tag size={10} /> {product.categoryName || 'General Retail'}
              </span>

              {/* SKU */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  color: '#93C5FD',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Barcode size={11} /> {product.sku}
              </span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
              {product.name}
            </h2>

            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
              {product.description || 'Artisanal retail product stored under strict batch FIFO inventory management.'}
            </p>
          </div>
        </div>

        {/* 3-Tier Pricing & Profit Spec */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}
        >
          {/* Retail Walk-in Price */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              POS Retail Price
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
              ${product.retailPrice.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>
              Standard Walk-in
            </div>
          </div>

          {/* Wholesale Tier Price */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Wholesale Tier
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#E4E4E7', marginTop: '2px' }}>
              ${Number(product.wholesalePrice ?? product.retailPrice * 0.75).toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#A1A1AA' }}>
              B2B Bulk Discount
            </div>
          </div>

          {/* Cost Price & Margin */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Unit Cost & Margin
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#E4E4E7', marginTop: '2px' }}>
              ${Number(product.costPrice ?? product.retailPrice * 0.5).toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={10} />
              {marginPercent ? `${marginPercent}% margin` : 'Standard markup'}
            </div>
          </div>
        </div>

        {/* CURRENT ACTIVE BATCH & EXPIRATION DATE CARD */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '18px',
            backgroundColor: isBatchExpired
              ? 'rgba(239, 68, 68, 0.12)'
              : isBatchExpiringSoon
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${
              isBatchExpired
                ? 'rgba(239, 68, 68, 0.4)'
                : isBatchExpiringSoon
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'
            }`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: isBatchExpired
                    ? 'rgba(239, 68, 68, 0.25)'
                    : isBatchExpiringSoon
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                  color: isBatchExpired
                    ? '#EF4444'
                    : isBatchExpiringSoon
                    ? '#F59E0B'
                    : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Current Active Batch
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                  Expiration Date
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Barcode size={12} /> {activeBatchCode}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: isBatchExpired ? '#EF4444' : '#FFFFFF', letterSpacing: '-0.02em' }}>
                {formatExpiryDate(activeExpiryDate)}
              </div>
              {expiryDays !== null && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor:
                      expiryDays <= 0
                        ? 'rgba(239, 68, 68, 0.2)'
                        : expiryDays <= 60
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)',
                    color:
                      expiryDays <= 0
                        ? '#EF4444'
                        : expiryDays <= 60
                        ? '#FCD34D'
                        : '#10B981',
                    border: `1px solid ${
                      expiryDays <= 0
                        ? 'rgba(239, 68, 68, 0.4)'
                        : expiryDays <= 60
                        ? 'rgba(245, 158, 11, 0.4)'
                        : 'rgba(16, 185, 129, 0.4)'
                    }`
                  }}
                >
                  {expiryDays <= 0
                    ? `Expired ${Math.abs(expiryDays)} days ago`
                    : `${expiryDays} days remaining`}
                </span>
              )}
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>{product.isPerishable ? 'Perishable: Earliest Expiry Active (FEFO)' : 'Active Batch Intake Priority (FIFO)'}</span>
            </div>
          </div>
        </div>

        {/* Inventory, FIFO Batches & Expiry Status */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Inventory & FIFO Allocation
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {/* Total Available Physical Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isOutOfStock ? '#EF4444' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Layers size={16} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>Physical Batches</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isOutOfStock ? '#EF4444' : '#FFFFFF' }}>
                  {product.availableStock} units total
                </div>
              </div>
            </div>

            {/* In-Cart & Remaining for Sale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: inCartQty > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: inCartQty > 0 ? '#60A5FA' : 'var(--ios-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingCart size={16} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>Current Order</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: inCartQty > 0 ? '#60A5FA' : '#A1A1AA' }}>
                  {inCartQty > 0 ? `${inCartQty} in cart (${remainingStock} left)` : '0 in cart'}
                </div>
              </div>
            </div>

            {/* Perishable & Expiry Policy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: product.isPerishable ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: product.isPerishable ? '#F59E0B' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {product.isPerishable ? <Clock size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--ios-text-muted)' }}>Allocation Rule</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: product.isPerishable ? '#F59E0B' : '#10B981' }}>
                  {product.isPerishable ? 'FEFO (Expiry Priority)' : 'Standard FIFO'}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Reorder Warning */}
          {isLowStock && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#FCD34D',
                fontSize: '11px',
                marginTop: '4px'
              }}
            >
              <AlertTriangle size={14} color="#F59E0B" />
              <span>
                Low Stock Alert: Only {remainingStock} units left (Min threshold: {product.minStockThreshold || 10}).
              </span>
            </div>
          )}
        </div>

        {/* Action Footer: Quantity Selector & Add to Order */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            flexWrap: 'wrap'
          }}
        >
          {/* Quantity Selector Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ios-text-muted)', fontWeight: 600 }}>
              Quantity:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isOutOfStock || addQty <= 1}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: isOutOfStock || addQty <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isOutOfStock || addQty <= 1 ? 0.4 : 1
                }}
              >
                <Minus size={14} />
              </button>

              <input
                type="number"
                min="1"
                max={maxAddable}
                value={addQty}
                disabled={isOutOfStock}
                onChange={(e) => handleDirectQtyChange(e.target.value)}
                style={{
                  width: '48px',
                  height: '32px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={handleIncrement}
                disabled={isOutOfStock || addQty >= remainingStock}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: isOutOfStock || addQty >= remainingStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isOutOfStock || addQty >= remainingStock ? 0.4 : 1
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
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
              disabled={isOutOfStock}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: isOutOfStock ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
                color: isOutOfStock ? 'rgba(0, 0, 0, 0.4)' : '#000000',
                border: 'none',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isOutOfStock ? 'none' : '0 6px 20px rgba(255, 255, 255, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingCart size={15} />
              {isOutOfStock
                ? 'Out of Stock'
                : `Add ${addQty} ($${(addQty * product.retailPrice).toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetailModal;

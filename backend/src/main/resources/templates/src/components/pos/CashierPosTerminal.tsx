import React, { useState, useEffect, useRef } from 'react';
import { PosProductScan, PosShift, ThermalReceipt } from '../../types/schema';
import { posService, DEFAULT_POS_PRODUCTS, PosCartItem } from '../../services/posService';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { ShiftManagementModal } from './ShiftManagementModal';
import { AppleSuccessModal } from './AppleSuccessModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PosSalesHistory } from './PosSalesHistory';
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  RotateCcw,
  Lock,
  AlertCircle,
  Clock,
  History,
  X
} from 'lucide-react';

export const CashierPosTerminal: React.FC = () => {
  const [products, setProducts] = useState<PosProductScan[]>(DEFAULT_POS_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState<boolean>(false);

  // View Mode: POS Terminal vs Sales History
  const [activeView, setActiveView] = useState<'TERMINAL' | 'SALES_HISTORY'>('TERMINAL');

  // Live Phnom Penh Clock & Shift Timer
  const [currentTime, setCurrentTime] = useState<string>('');
  const [shiftElapsed, setShiftElapsed] = useState<string>('');

  // Shift & Receipt State
  const [activeShift, setActiveShift] = useState<PosShift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<ThermalReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Apple-style Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastSuccessInfo, setLastSuccessInfo] = useState<{
    total: number;
    method: string;
    changeDue: number;
    orderNumber: string;
  } | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const errorTimeoutRef = useRef<any>(null);
  const isShiftOpen = activeShift && activeShift.status === 'OPEN';

  // Auto-dismissing error toast
  const showError = (msg: string) => {
    setErrorMessage(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  };

  // Load products from live backend
  const fetchProducts = async () => {
    try {
      const liveProducts = await posService.getProducts();
      setProducts(liveProducts);
    } catch (err) {
      console.warn('Fallback to default products:', err);
    }
  };

  useEffect(() => {
    // Initial active shift check against PostgreSQL backend
    posService.getCurrentShift()
      .then((shift) => {
        setActiveShift(shift);
      })
      .catch(() => {
        setActiveShift(null);
      });

    fetchProducts();
  }, []);

  // Real-time Phnom Penh Clock (UTC+7) & Live Shift Counting Timer
  useEffect(() => {
    const updateTimeAndShift = () => {
      const now = new Date();
      // Format Phnom Penh local time
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);
      setCurrentTime(timeStr);

      // Real-time Shift Duration Counter
      if (activeShift && activeShift.status === 'OPEN' && activeShift.openedAt) {
        const opened = new Date(activeShift.openedAt).getTime();
        const diffSec = Math.max(0, Math.floor((now.getTime() - opened) / 1000));
        const hrs = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        if (hrs > 0) {
          setShiftElapsed(`${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
        } else {
          setShiftElapsed(`${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
        }
      } else {
        setShiftElapsed('');
      }
    };

    updateTimeAndShift();
    const interval = setInterval(updateTimeAndShift, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  // Cart calculations
  const subtotal = Math.round(cart.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;
  const taxAmount = Math.round(subtotal * 0.07 * 100) / 100; // 7% VAT standard
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;
  const numericTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, Math.round((numericTendered - grandTotal) * 100) / 100);

  // Only flag insufficient cash when cashier explicitly tried to charge or typed an insufficient amount
  const isCashInsufficient = hasAttemptedCheckout && paymentMethod === 'CASH' && numericTendered < grandTotal && grandTotal > 0;

  // Add product to cart with strict shift check and real-time stock deduction
  const handleAddToCart = (product: PosProductScan) => {
    setErrorMessage(null);

    // CRITICAL REQUIREMENT: Shift must be open before adding products
    if (!isShiftOpen) {
      showError('Cannot add products: Shift is closed. Please open a shift float first.');
      setIsShiftModalOpen(true);
      return;
    }

    const existing = cart.find((it) => it.productId === product.id);
    const inCartQty = existing ? existing.quantity : 0;
    const remainingStock = product.availableStock - inCartQty;

    if (remainingStock <= 0) {
      showError(`Cannot exceed available batch stock of ${product.availableStock} for '${product.name}'.`);
      return;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: Math.round((it.quantity + 1) * it.retailPrice * 100) / 100
              }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          retailPrice: product.retailPrice,
          quantity: 1,
          subtotal: product.retailPrice
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const nextQty = it.quantity + delta;

            if (delta < 0 && nextQty <= 0) {
              // Trigger confirmation modal when reducing to 0
              setDeleteConfirm({
                isOpen: true,
                title: 'Remove Item from Order?',
                message: `Are you sure you want to remove "${it.name}" from the current order?`,
                confirmLabel: 'Remove Item',
                onConfirm: () => {
                  setCart((current) => current.filter((item) => item.productId !== productId));
                  setDeleteConfirm(null);
                }
              });
              return it;
            }

            if (product && nextQty > product.availableStock) {
              showError(`Cannot exceed available stock of ${product.availableStock} for ${product.name}`);
              return it;
            }

            return nextQty > 0
              ? { ...it, quantity: nextQty, subtotal: Math.round(nextQty * it.retailPrice * 100) / 100 }
              : null;
          }
          return it;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  // Direct number input for cart line item quantity
  const handleDirectQuantityInput = (productId: number, rawValue: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (rawValue === '') {
      setCart((prev) =>
        prev.map((it) => (it.productId === productId ? { ...it, quantity: 1, subtotal: it.retailPrice } : it))
      );
      return;
    }

    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return;
    }

    if (parsed > product.availableStock) {
      showError(`Maximum available stock for ${product.name} is ${product.availableStock}.`);
      setCart((prev) =>
        prev.map((it) =>
          it.productId === productId
            ? {
                ...it,
                quantity: product.availableStock,
                subtotal: Math.round(product.availableStock * it.retailPrice * 100) / 100
              }
            : it
        )
      );
      return;
    }

    setCart((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? {
              ...it,
              quantity: parsed,
              subtotal: Math.round(parsed * it.retailPrice * 100) / 100
            }
          : it
      )
    );
  };

  const promptRemoveItem = (item: PosCartItem) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remove Item from Order?',
      message: `Are you sure you want to remove "${item.name}" (${item.quantity}x) from the current order?`,
      confirmLabel: 'Remove Item',
      onConfirm: () => {
        setCart((prev) => prev.filter((it) => it.productId !== item.productId));
        setDeleteConfirm(null);
      }
    });
  };

  const promptClearCart = () => {
    if (cart.length === 0) return;
    setDeleteConfirm({
      isOpen: true,
      title: 'Clear Entire Order?',
      message: `Are you sure you want to clear all ${cart.length} item(s) from the current order?`,
      confirmLabel: 'Clear Order',
      onConfirm: () => {
        setCart([]);
        setAmountTendered('');
        setHasAttemptedCheckout(false);
        setDeleteConfirm(null);
      }
    });
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setErrorMessage(null);

    if (!isShiftOpen) {
      showError('Cannot add products: Shift is closed. Please open a shift float first.');
      setIsShiftModalOpen(true);
      return;
    }

    try {
      const scanned = await posService.scanProduct(barcodeInput.trim());
      handleAddToCart(scanned);
      setBarcodeInput('');
    } catch (err: any) {
      showError(err.message || 'Product SKU not found');
    }
  };

  const handlePresetTender = (amount: number) => {
    setAmountTendered(amount.toFixed(2));
    setHasAttemptedCheckout(false);
  };

  const handleCheckout = async () => {
    setHasAttemptedCheckout(true);

    if (!isShiftOpen) {
      showError('Cannot complete sale: Shift is closed. Please open a shift float first.');
      setIsShiftModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      showError('POS cart is empty. Add items to proceed.');
      return;
    }
    if (paymentMethod === 'CASH' && numericTendered < grandTotal) {
      showError(`Insufficient cash tendered. Total is $${grandTotal.toFixed(2)}, received $${numericTendered.toFixed(2)}.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const itemsPayload = cart.map((it) => ({ productId: it.productId, quantity: it.quantity }));
      const result = await posService.checkoutWalkIn(itemsPayload, numericTendered, paymentMethod);

      // Construct thermal receipt payload
      const receipt: ThermalReceipt = {
        storeName: 'ONLINE RETAIL POS - STORE #01',
        terminalId: 'POS-TERM-01',
        cashierName: activeShift?.cashierName || 'POS Lead Cashier',
        orderNumber: result.order.orderNumber,
        dateTime: currentTime || new Date().toLocaleString(),
        items: cart.map((it) => ({
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.retailPrice,
          subtotal: it.subtotal
        })),
        subtotal: result.order.subtotal,
        taxAmount: result.order.taxAmount,
        grandTotal: result.order.totalAmount,
        amountTendered: numericTendered || result.order.totalAmount,
        changeDue: result.changeDue,
        barcodeData: `RCP*${result.order.orderNumber}*V1`
      };

      // Real-time FIFO inventory deduction on local catalog
      setProducts((prev) =>
        prev.map((p) => {
          const purchased = cart.find((it) => it.productId === p.id);
          if (purchased) {
            return {
              ...p,
              availableStock: Math.max(0, p.availableStock - purchased.quantity)
            };
          }
          return p;
        })
      );

      // Update active shift drawer stats
      if (activeShift && activeShift.status === 'OPEN') {
        setActiveShift({
          ...activeShift,
          totalTransactions: activeShift.totalTransactions + 1,
          systemCashTotal:
            paymentMethod === 'CASH'
              ? Math.round((activeShift.systemCashTotal + result.order.totalAmount) * 100) / 100
              : activeShift.systemCashTotal
        });
      }

      setReceiptData(receipt);
      setLastSuccessInfo({
        total: result.order.totalAmount,
        method: paymentMethod,
        changeDue: result.changeDue,
        orderNumber: result.order.orderNumber
      });

      // Trigger Apple Pay style success animation modal
      setIsSuccessModalOpen(true);
      setCart([]);
      setAmountTendered('');
      setHasAttemptedCheckout(false);

      // Refresh live product catalog in background to ensure perfect batch synchronization
      fetchProducts();
    } catch (err: any) {
      showError(err.message || 'Checkout failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenShift = async (floatAmount: number, notes: string) => {
    const shift = await posService.openShift(floatAmount, notes);
    setActiveShift(shift);
    fetchProducts();
  };

  const handleCloseShift = async (closingCash: number, notes: string) => {
    const shift = await posService.closeShift(closingCash, notes);
    setActiveShift(shift);
    fetchProducts();
  };

  // Filtered catalog
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Beverages' && (p.name.includes('Coffee') || p.name.includes('Water') || p.name.includes('Milk') || p.name.includes('Latte'))) ||
      (selectedCategory === 'Snacks' && (p.name.includes('Bar') || p.name.includes('Crisps') || p.name.includes('Chocolate'))) ||
      (selectedCategory === 'Nutrition' && (p.name.includes('Protein') || p.name.includes('Matcha') || p.name.includes('Energy')));
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top POS Header, Cambodia Clock & Shift Status Bar */}
      <div
        className="ios-glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
          >
            <Barcode size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>POS Touchscreen Terminal</h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF'
                }}
              >
                STORE #01 • TERM-POS-01
              </span>
            </div>

            {/* Phnom Penh Time & Staff Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '12px', color: 'var(--ios-text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60A5FA', fontWeight: 600 }}>
                <Clock size={12} />
                {currentTime ? `Phnom Penh: ${currentTime}` : 'Phnom Penh (UTC+7)'}
              </span>
              <span>•</span>
              <span>Staff: {activeShift?.cashierName || 'Jane Doe (ID #1)'}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <Lock size={12} /> Retail FIFO Locked
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher & Shift Drawer HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Switch View Button: Terminal vs Sales History */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveView('TERMINAL')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'TERMINAL' ? '#FFFFFF' : 'transparent',
                color: activeView === 'TERMINAL' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.15s ease'
              }}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveView('SALES_HISTORY')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: activeView === 'SALES_HISTORY' ? '#FFFFFF' : 'transparent',
                color: activeView === 'SALES_HISTORY' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.15s ease'
              }}
            >
              <History size={13} />
              Sales History
            </button>
          </div>

          {/* Shift Drawer HUD with Live Real-time Shift Duration */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isShiftOpen ? '#10B981' : '#F59E0B',
                boxShadow: isShiftOpen ? '0 0 8px #10B981' : 'none'
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{isShiftOpen ? 'SHIFT ACTIVE' : 'SHIFT CLOSED'}</span>
                {isShiftOpen && shiftElapsed && (
                  <span style={{ fontSize: '10px', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                    ⏱️ {shiftElapsed}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                Float: ${Number(activeShift?.openingFloat ?? 0).toFixed(2)} | Cash: ${Number(activeShift?.systemCashTotal ?? 0).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsShiftModalOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isShiftOpen ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF',
              color: isShiftOpen ? '#FFFFFF' : '#000000',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isShiftOpen ? 'Reconcile Drawer' : 'Open Shift Float'}
          </button>
        </div>
      </div>

      {/* Auto-Dismissing Error banner if present */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FCA5A5',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Shift Closed Warning Banner */}
      {!isShiftOpen && (
        <div
          className="ios-glass-panel"
          style={{
            padding: '14px 20px',
            borderRadius: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#F59E0B" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FCD34D' }}>
                SHIFT IS CURRENTLY CLOSED
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                You must open a shift float before ringing up walk-in sales or adding items to current order.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: '#F59E0B',
              color: '#000000',
              fontWeight: 800,
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            Open Shift Float
          </button>
        </div>
      )}

      {/* VIEW 1: POS TOUCHSCREEN TERMINAL */}
      {activeView === 'TERMINAL' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 420px',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Fast Product Catalog & Barcode Scanner */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Barcode & Search Bar */}
            <div
              className="ios-glass-panel"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Barcode
                    size={18}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
                  />
                  <input
                    type="text"
                    placeholder={isShiftOpen ? "Scan barcode SKU (e.g. SKU-ENERGY-BAR) or type & press Enter..." : "Shift Closed - Open shift to enable scanner"}
                    disabled={!isShiftOpen}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      opacity: !isShiftOpen ? 0.6 : 1
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isShiftOpen}
                  style={{
                    padding: '0 20px',
                    backgroundColor: isShiftOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                    color: isShiftOpen ? '#000000' : 'rgba(0, 0, 0, 0.4)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isShiftOpen ? 'pointer' : 'not-allowed'
                  }}
                >
                  Scan SKU
                </button>
              </form>

              {/* Live Search and Category Filter Row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
                  />
                  <input
                    type="text"
                    placeholder="Search products by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['All', 'Beverages', 'Snacks', 'Nutrition'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === cat ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                        color: selectedCategory === cat ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Demo Scan Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>Quick Scan Demo:</span>
                {products.slice(0, 4).map((p) => {
                  const cartItem = cart.find((it) => it.productId === p.id);
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const remainingStock = Math.max(0, p.availableStock - inCartQty);
                  const isAvailable = remainingStock > 0;

                  return (
                    <button
                      key={p.id}
                      onClick={() => isAvailable && handleAddToCart(p)}
                      disabled={!isAvailable}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: isAvailable ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: isAvailable ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                        fontSize: '11px',
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}
                    >
                      +{p.name.split(' ')[0]} (${p.retailPrice.toFixed(2)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid with REAL-TIME FIFO Stock Deduction on Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                maxHeight: '620px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}
            >
              {filteredProducts.map((product) => {
                // Real-time stock calculation: Total Batch Stock - In Cart Quantity
                const cartItem = cart.find((it) => it.productId === product.id);
                const inCartQty = cartItem ? cartItem.quantity : 0;
                const remainingStock = Math.max(0, product.availableStock - inCartQty);
                const isOutOfStock = remainingStock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className="ios-glass-panel ios-glow-hover"
                    style={{
                      padding: '12px',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      backgroundColor: isOutOfStock ? 'rgba(24, 24, 27, 0.4)' : 'rgba(24, 24, 27, 0.65)',
                      opacity: isOutOfStock ? 0.65 : 1,
                      position: 'relative'
                    }}
                  >
                    {/* Product Image Container */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '110px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Barcode size={32} style={{ opacity: 0.3 }} />
                      )}

                      {/* SKU Tag */}
                      <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                            color: '#FFFFFF'
                          }}
                        >
                          {product.sku}
                        </span>
                      </div>

                      {/* FEFO Tag */}
                      {product.isPerishable && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(245, 158, 11, 0.9)',
                              backdropFilter: 'blur(4px)',
                              color: '#000000'
                            }}
                          >
                            FEFO
                          </span>
                        </div>
                      )}

                      {/* In-Cart Indicator Badge */}
                      {inCartQty > 0 && (
                        <div style={{ position: 'absolute', bottom: '6px', right: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            {inCartQty} in cart
                          </span>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(2px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: inCartQty > 0 ? '#FCD34D' : '#EF4444',
                            fontWeight: 800,
                            fontSize: '11px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {inCartQty > 0 ? 'MAX IN CART' : 'OUT OF STOCK'}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          margin: '0 0 4px',
                          color: '#FFFFFF',
                          lineHeight: 1.3,
                          height: '34px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {product.name}
                      </h3>
                      {/* Real-time remaining stock displayed dynamically */}
                      <div
                        style={{
                          fontSize: '11px',
                          color: isOutOfStock ? '#EF4444' : remainingStock <= 5 ? '#F59E0B' : 'var(--ios-text-muted)',
                          fontWeight: 600
                        }}
                      >
                        {isOutOfStock
                          ? inCartQty > 0
                            ? `0 remaining (Max in Cart)`
                            : '0 in stock (FIFO)'
                          : `${remainingStock} in stock (FIFO)`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                        ${product.retailPrice.toFixed(2)}
                      </div>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isOutOfStock ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF'
                        }}
                      >
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: FIXED WIDTH Current Order & Tender Drawer (Width never expands) */}
          <div
            className="ios-glass-panel"
            style={{
              width: '420px',
              minWidth: '420px',
              maxWidth: '420px',
              flexShrink: 0,
              boxSizing: 'border-box',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: 'fit-content'
            }}
          >
            {/* Cart Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Current Order</h3>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF'
                  }}
                >
                  {cart.length} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={promptClearCart}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ios-text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}
            >
              {cart.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--ios-text-muted)',
                    fontSize: '13px'
                  }}
                >
                  <Barcode size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  {isShiftOpen
                    ? 'Scan product barcode or tap items from the catalog grid to build the walk-in order.'
                    : 'Shift is closed. Open a starting float to begin adding products to current order.'}
                </div>
              ) : (
                cart.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={item.productId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {/* Thumbnail Image */}
                      {prod?.imageUrl && (
                        <img
                          src={prod.imageUrl}
                          alt={item.name}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            marginRight: '8px',
                            flexShrink: 0
                          }}
                        />
                      )}

                      {/* Product Name & Unit Price with strict truncation */}
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                          ${item.retailPrice.toFixed(2)} ea
                        </div>
                      </div>

                      {/* Quantity Stepper with DIRECT TYPE-IN INPUT */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={11} />
                        </button>

                        {/* Direct Number Input */}
                        <input
                          type="number"
                          min="1"
                          max={prod ? prod.availableStock : 999}
                          value={item.quantity}
                          onChange={(e) => handleDirectQuantityInput(item.productId, e.target.value)}
                          style={{
                            width: '36px',
                            height: '24px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            outline: 'none',
                            padding: '0 2px'
                          }}
                        />

                        <button
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 700, width: '60px', textAlign: 'right', flexShrink: 0 }}>
                        ${item.subtotal.toFixed(2)}
                      </div>

                      <button
                        onClick={() => promptRemoveItem(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ios-text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          marginLeft: '4px',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pricing Totals Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ios-text-muted)' }}>
                <span>7% VAT Tax:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)', marginBottom: '8px' }}>
                PAYMENT METHOD
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {(['CASH', 'CARD', 'BANK_TRANSFER'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentMethod(method);
                      setHasAttemptedCheckout(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: paymentMethod === method ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      backgroundColor: paymentMethod === method ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                      color: paymentMethod === method ? '#000000' : '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {method === 'CASH' && <Banknote size={14} />}
                    {method === 'CARD' && <CreditCard size={14} />}
                    {method === 'BANK_TRANSFER' && <DollarSign size={14} />}
                    {method === 'BANK_TRANSFER' ? 'TRANSFER' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender Presets & Change Due Calculator (NO premature red alert) */}
            {paymentMethod === 'CASH' && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isCashInsufficient ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-muted)' }}>
                    QUICK CASH TENDER
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handlePresetTender(grandTotal)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Exact
                    </button>
                    <button
                      onClick={() => handlePresetTender(20)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      $20
                    </button>
                    <button
                      onClick={() => handlePresetTender(50)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      $50
                    </button>
                    <button
                      onClick={() => handlePresetTender(100)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      $100
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <DollarSign
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => {
                      setAmountTendered(e.target.value);
                      setHasAttemptedCheckout(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${isCashInsufficient ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'}`,
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Live Change Due HUD */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  <span style={{ color: isCashInsufficient ? '#EF4444' : '#10B981' }}>
                    {isCashInsufficient
                      ? `Short: -$${Math.abs(numericTendered - grandTotal).toFixed(2)}`
                      : 'Change Due:'}
                  </span>
                  <span style={{ fontSize: '16px', color: isCashInsufficient ? '#EF4444' : '#10B981' }}>
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
              style={{
                padding: '16px',
                backgroundColor: cart.length === 0 ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
                color: cart.length === 0 ? 'rgba(0, 0, 0, 0.4)' : '#000000',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: cart.length > 0 ? '0 10px 25px rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Receipt size={18} />
              {isProcessing ? 'Processing Transaction...' : `Charge $${grandTotal.toFixed(2)} & Print Receipt`}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: CASHIER SALES & TRANSACTION HISTORY */}
      {activeView === 'SALES_HISTORY' && (
        <PosSalesHistory
          onBackToTerminal={() => setActiveView('TERMINAL')}
          onViewReceipt={(receipt) => {
            setReceiptData(receipt);
            setIsReceiptModalOpen(true);
          }}
          currentCashierName={activeShift?.cashierName}
        />
      )}

      {/* Apple-Style Success Animation Modal */}
      <AppleSuccessModal
        isOpen={isSuccessModalOpen}
        totalAmount={lastSuccessInfo?.total || 0}
        paymentMethod={lastSuccessInfo?.method || 'CASH'}
        amountTendered={numericTendered || lastSuccessInfo?.total}
        changeDue={lastSuccessInfo?.changeDue || 0}
        orderNumber={lastSuccessInfo?.orderNumber}
        onComplete={() => {
          setIsSuccessModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Delete Item / Clear Cart Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirm?.isOpen)}
        title={deleteConfirm?.title || 'Remove Product'}
        message={deleteConfirm?.message || 'Are you sure you want to remove this item?'}
        confirmLabel={deleteConfirm?.confirmLabel || 'Remove Item'}
        onConfirm={() => deleteConfirm?.onConfirm()}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* 80mm ESC/POS Monochromatic Thermal Receipt Modal */}
      <ThermalReceiptModal
        receipt={receiptData}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => {
          setIsReceiptModalOpen(false);
          setCart([]);
          setAmountTendered('');
          setHasAttemptedCheckout(false);
        }}
      />

      {/* Shift Float & Drawer Reconciliation Modal */}
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        activeShift={activeShift}
        onClose={() => setIsShiftModalOpen(false)}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
      />
    </div>
  );
};
export default CashierPosTerminal;

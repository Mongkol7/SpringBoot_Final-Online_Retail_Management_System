import React, { useState, useEffect, useRef } from 'react';
import { PosProductScan, PosShift, ThermalReceipt } from '../../types/schema';
import { posService, DEFAULT_POS_PRODUCTS, PosCartItem, CashierStaff } from '../../services/posService';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { ShiftManagementModal } from './ShiftManagementModal';
import { AppleSuccessModal } from './AppleSuccessModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { PosSalesHistory } from './PosSalesHistory';
import { ProductDetailModal } from './ProductDetailModal';
import { CashierPinModal } from './CashierPinModal';
import { LogoutConfirmModal } from '../ui/LogoutConfirmModal';
import { UserProfileModal } from '../ui/UserProfileModal';
import { useAuth } from '../../context/AuthContext';
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
  X,
  Info,
  Eye,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const CashierPosTerminal: React.FC = () => {
  const { currentUser, logoutRole } = useAuth();
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

  // Step 2: Cashier PIN Authentication & Identification
  const [activeCashier, setActiveCashier] = useState<CashierStaff | null>(() => posService.getActiveCashier());
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(() => !posService.getActiveCashier());

  // Cashier Profile & Avatar State (Local Storage & Image Link support)
  const [showCashierProfileModal, setShowCashierProfileModal] = useState(false);
  const [cashierAvatar, setCashierAvatar] = useState<string>(() => {
    const key = activeCashier?.id ? `aura_avatar_${activeCashier.id}` : (currentUser?.userId ? `aura_avatar_${currentUser.userId}` : 'aura_avatar_cashier');
    return localStorage.getItem(key) || localStorage.getItem('aura_avatar_cashier') || '';
  });

  useEffect(() => {
    const key = activeCashier?.id ? `aura_avatar_${activeCashier.id}` : (currentUser?.userId ? `aura_avatar_${currentUser.userId}` : 'aura_avatar_cashier');
    const saved = localStorage.getItem(key) || localStorage.getItem('aura_avatar_cashier') || '';
    setCashierAvatar(saved);
  }, [activeCashier, currentUser]);

  const cashierProfileUser = {
    id: activeCashier?.id || currentUser?.userId || 2,
    fullName: activeCashier?.fullName || currentUser?.fullName || 'Cashier Staff',
    email: currentUser?.email || activeCashier?.email || 'cashier@aura.store',
    role: 'CASHIER' as any,
    avatarUrl: cashierAvatar
  };

  const handleSaveCashierProfile = async (updated: {
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    addresses?: string[];
    companyName?: string;
  }) => {
    const cashierId = activeCashier?.id || currentUser?.userId;
    const key = cashierId ? `aura_avatar_${cashierId}` : 'aura_avatar_cashier';
    if (updated.avatarUrl) {
      setCashierAvatar(updated.avatarUrl);
      localStorage.setItem(key, updated.avatarUrl);
      localStorage.setItem('aura_avatar_cashier', updated.avatarUrl);
      if (cashierId) {
        localStorage.setItem(`aura_avatar_user_${cashierId}`, updated.avatarUrl);
      }
      localStorage.setItem('aura_avatar_current', updated.avatarUrl);
    } else {
      setCashierAvatar('');
      localStorage.removeItem(key);
      localStorage.removeItem('aura_avatar_cashier');
      if (cashierId) {
        localStorage.removeItem(`aura_avatar_user_${cashierId}`);
      }
      localStorage.removeItem('aura_avatar_current');
    }
    if (activeCashier && updated.fullName) {
      const updatedStaff = { ...activeCashier, fullName: updated.fullName };
      setActiveCashier(updatedStaff);
      localStorage.setItem('active_cashier', JSON.stringify(updatedStaff));
    }

    // Persist to PostgreSQL database
    try {
      await posService.updateProfile({
        fullName: updated.fullName,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        companyName: updated.companyName
      });
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Failed to persist cashier profile to backend DB:', err);
    }
  };

  // View Mode: POS Terminal vs Sales History
  const [activeView, setActiveView] = useState<'TERMINAL' | 'SALES_HISTORY'>('TERMINAL');

  // Live Phnom Penh Clock & Shift Timer
  const [currentTime, setCurrentTime] = useState<string>('');
  const [shiftElapsed, setShiftElapsed] = useState<string>('');

  // Shift & Receipt State
  const [activeShift, setActiveShift] = useState<PosShift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  // Floating Product Detail Modal State
  const [selectedProductDetail, setSelectedProductDetail] = useState<PosProductScan | null>(null);

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
    // Initial active shift check against PostgreSQL backend for this specific cashier
    posService.getCurrentShift(activeCashier?.id)
      .then((shift) => {
        setActiveShift(shift);
      })
      .catch(() => {
        setActiveShift(null);
      });

    fetchProducts();
  }, [activeCashier]);

  const handleLockRegister = () => {
    if (isShiftOpen) {
      showError('Cannot switch cashier: Please close and reconcile your active shift first.');
      setIsShiftModalOpen(true);
      return;
    }
    posService.lockRegister();
    setActiveCashier(null);
    setIsPinModalOpen(true);
  };

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

  // Separate totals for <1mo clearance and normal expiry products
  const clearanceCartItems = cart.filter((it) => it.batchPreference === 'CLEARANCE');
  const freshCartItems = cart.filter((it) => it.batchPreference !== 'CLEARANCE');
  const clearanceItemsQty = clearanceCartItems.reduce((acc, it) => acc + it.quantity, 0);
  const clearanceItemsTotal = Math.round(clearanceCartItems.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;
  const freshItemsQty = freshCartItems.reduce((acc, it) => acc + it.quantity, 0);
  const freshItemsTotal = Math.round(freshCartItems.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;

  // Available physical cash in drawer = opening float + cash earned from sales in current shift
  const availableDrawerCash = Math.round(((activeShift?.openingFloat || 0) + (activeShift?.systemCashTotal || 0)) * 100) / 100;
  const isChangeExceedingDrawer = paymentMethod === 'CASH' && changeDue > availableDrawerCash;

  // Only flag insufficient cash when cashier explicitly tried to charge or typed an insufficient amount
  const isCashInsufficient = hasAttemptedCheckout && paymentMethod === 'CASH' && numericTendered < grandTotal && grandTotal > 0;

  // Add product to cart with strict shift check, real-time stock deduction, and strict batch quantity limits
  const handleAddToCart = (product: PosProductScan, batchPreference: 'FRESH' | 'CLEARANCE' = 'FRESH') => {
    setErrorMessage(null);

    // CRITICAL REQUIREMENT: Register must be unlocked with Cashier PIN
    if (!activeCashier) {
      showError('Register is locked. Please enter your Cashier PIN.');
      setIsPinModalOpen(true);
      return;
    }

    // CRITICAL REQUIREMENT: Shift must be open before adding products
    if (!isShiftOpen) {
      showError('Cannot add products: Shift is closed. Please open a shift float first.');
      setIsShiftModalOpen(true);
      return;
    }

    const isClearance = batchPreference === 'CLEARANCE';
    const clearanceMax = product.nearExpiryQuantity !== undefined ? product.nearExpiryQuantity : 10;
    const freshMax = product.freshStockQuantity !== undefined ? product.freshStockQuantity : Math.max(0, product.availableStock - clearanceMax);

    const existing = cart.find(
      (it) => it.productId === product.id && (it.batchPreference || 'FRESH') === batchPreference
    );
    const currentInCartQty = existing ? existing.quantity : 0;

    if (isClearance) {
      if (clearanceMax <= 0) {
        showError(`No <1 month clearance batch stock available for '${product.name}'.`);
        return;
      }
      if (currentInCartQty + 1 > clearanceMax) {
        showError(`Cannot add more than ${clearanceMax} units: The <1 month clearance batch only has ${clearanceMax} available.`);
        return;
      }
    } else {
      if (currentInCartQty + 1 > freshMax) {
        showError(`Cannot add more than ${freshMax} units: Normal batch only has ${freshMax} available.`);
        return;
      }
    }

    const clearancePrice = Math.round(product.retailPrice * 0.75 * 100) / 100;
    const unitPrice = isClearance ? clearancePrice : product.retailPrice;
    const displayName = isClearance ? `${product.name} (Clearance <1mo 25% OFF)` : product.name;

    setCart((prev) => {
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id && (it.batchPreference || 'FRESH') === batchPreference
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: Math.round((it.quantity + 1) * unitPrice * 100) / 100
              }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: displayName,
          sku: product.sku,
          retailPrice: unitPrice,
          quantity: 1,
          subtotal: unitPrice,
          batchPreference,
          isClearance,
          expiryDate: isClearance ? product.currentBatchExpiryDate : (product.freshBatchExpiryDate || product.currentBatchExpiryDate)
        }
      ];
    });
  };

  // Add custom quantity of product to cart (from ProductDetailModal) with strict batch limits
  const handleAddMultipleToCart = (
    product: PosProductScan,
    quantity: number,
    batchPreference: 'FRESH' | 'CLEARANCE' = 'FRESH'
  ) => {
    setErrorMessage(null);

    if (!activeCashier) {
      showError('Register is locked. Please enter your Cashier PIN.');
      setIsPinModalOpen(true);
      return;
    }

    if (!isShiftOpen) {
      showError('Cannot add products: Shift is closed. Please open a shift float first.');
      setIsShiftModalOpen(true);
      return;
    }

    const isClearance = batchPreference === 'CLEARANCE';
    const clearanceMax = product.nearExpiryQuantity !== undefined ? product.nearExpiryQuantity : 10;
    const freshMax = product.freshStockQuantity !== undefined ? product.freshStockQuantity : Math.max(0, product.availableStock - clearanceMax);

    const existing = cart.find(
      (it) => it.productId === product.id && (it.batchPreference || 'FRESH') === batchPreference
    );
    const currentInCartQty = existing ? existing.quantity : 0;

    if (isClearance) {
      if (clearanceMax <= 0) {
        showError(`No <1 month clearance batch stock available for '${product.name}'.`);
        return;
      }
      if (currentInCartQty + quantity > clearanceMax) {
        showError(`Cannot add ${quantity} units: The <1 month clearance batch has ${clearanceMax} total (${currentInCartQty} already in cart).`);
        return;
      }
    } else {
      if (currentInCartQty + quantity > freshMax) {
        showError(`Cannot add ${quantity} units: Normal batch has ${freshMax} total (${currentInCartQty} already in cart).`);
        return;
      }
    }

    const clearancePrice = Math.round(product.retailPrice * 0.75 * 100) / 100;
    const unitPrice = isClearance ? clearancePrice : product.retailPrice;
    const displayName = isClearance ? `${product.name} (Clearance <1mo 25% OFF)` : product.name;

    setCart((prev) => {
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id && (it.batchPreference || 'FRESH') === batchPreference
            ? {
                ...it,
                quantity: it.quantity + quantity,
                subtotal: Math.round((it.quantity + quantity) * unitPrice * 100) / 100
              }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: displayName,
          sku: product.sku,
          retailPrice: unitPrice,
          quantity: quantity,
          subtotal: Math.round(quantity * unitPrice * 100) / 100,
          batchPreference,
          isClearance,
          expiryDate: isClearance ? product.currentBatchExpiryDate : (product.freshBatchExpiryDate || product.currentBatchExpiryDate)
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId: number, delta: number, batchPreference: string = 'FRESH') => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId && (it.batchPreference || 'FRESH') === batchPreference) {
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
                  setCart((current) => current.filter((item) => !(item.productId === productId && (item.batchPreference || 'FRESH') === batchPreference)));
                  setDeleteConfirm(null);
                }
              });
              return it;
            }

            const isClearance = (batchPreference || 'FRESH') === 'CLEARANCE';
            const clearanceMax = product?.nearExpiryQuantity !== undefined ? product.nearExpiryQuantity : 10;
            const freshMax = product?.freshStockQuantity !== undefined ? product.freshStockQuantity : (product ? Math.max(0, product.availableStock - clearanceMax) : 999);
            const batchLimit = isClearance ? clearanceMax : freshMax;

            if (delta > 0 && nextQty > batchLimit) {
              showError(`Cannot exceed ${isClearance ? '<1 month clearance' : 'normal'} batch limit of ${batchLimit} for ${product?.name || 'this item'}.`);
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
  const handleDirectQuantityInput = (productId: number, rawValue: string, batchPreference: string = 'FRESH') => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (rawValue === '') {
      setCart((prev) =>
        prev.map((it) => (it.productId === productId && (it.batchPreference || 'FRESH') === batchPreference ? { ...it, quantity: 1, subtotal: it.retailPrice } : it))
      );
      return;
    }

    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return;
    }

    const isClearance = (batchPreference || 'FRESH') === 'CLEARANCE';
    const clearanceMax = product.nearExpiryQuantity !== undefined ? product.nearExpiryQuantity : 10;
    const freshMax = product.freshStockQuantity !== undefined ? product.freshStockQuantity : Math.max(0, product.availableStock - clearanceMax);
    const batchLimit = isClearance ? clearanceMax : freshMax;

    if (parsed > batchLimit) {
      showError(`Cannot exceed ${isClearance ? '<1 month clearance' : 'normal'} batch limit of ${batchLimit} for ${product.name}.`);
      setCart((prev) =>
        prev.map((it) =>
          it.productId === productId && (it.batchPreference || 'FRESH') === batchPreference
            ? {
                ...it,
                quantity: batchLimit,
                subtotal: Math.round(batchLimit * it.retailPrice * 100) / 100
              }
            : it
        )
      );
      return;
    }

    setCart((prev) =>
      prev.map((it) =>
        it.productId === productId && (it.batchPreference || 'FRESH') === batchPreference
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
        setCart((prev) => prev.filter((it) => !(it.productId === item.productId && (it.batchPreference || 'FRESH') === (item.batchPreference || 'FRESH'))));
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
    if (paymentMethod === 'CASH') {
      if (numericTendered < grandTotal) {
        showError(`Insufficient cash tendered. Total is $${grandTotal.toFixed(2)}, received $${numericTendered.toFixed(2)}.`);
        return;
      }
      if (changeDue > availableDrawerCash) {
        showError(`Cannot complete cash sale: Insufficient cash in drawer to dispense change. Available float is $${availableDrawerCash.toFixed(2)} ($${(activeShift?.openingFloat || 0).toFixed(2)} float + $${(activeShift?.systemCashTotal || 0).toFixed(2)} cash sales), but change due is $${changeDue.toFixed(2)}.`);
        return;
      }
    }

    if (!activeCashier) {
      showError('Cashier is not signed in. Please enter your PIN.');
      setIsPinModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const itemsPayload = cart.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        batchPreference: it.batchPreference || 'FRESH'
      }));
      const result = await posService.checkoutWalkIn(itemsPayload, numericTendered, paymentMethod, activeCashier.id);

      // Construct thermal receipt payload with active cashier identity
      const receipt: ThermalReceipt = {
        storeName: 'ONLINE RETAIL POS - STORE #01',
        terminalId: 'POS-TERM-01',
        cashierName: `${activeCashier.fullName} (ID #${activeCashier.id})`,
        orderNumber: result.order.orderNumber,
        dateTime: currentTime || new Date().toLocaleString(),
        items: cart.map((it) => ({
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.retailPrice,
          subtotal: it.subtotal,
          batchPreference: it.batchPreference,
          isClearance: it.isClearance,
          expiryDate: it.expiryDate
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
    const shift = await posService.openShift(floatAmount, notes, activeCashier?.id);
    setActiveShift(shift);
    fetchProducts();
  };

  const handleCloseShift = async (closingCash: number, notes: string, lockRegister: boolean = true) => {
    const shift = await posService.closeShift(closingCash, notes, activeCashier?.id);
    setActiveShift(shift);
    fetchProducts();
    if (lockRegister) {
      posService.lockRegister();
      setActiveCashier(null);
      setIsPinModalOpen(true);
    }
  };

  // Filtered catalog supporting dropdown categories
  const filteredProducts = products.filter((p) => {
    const pCat = (p.categoryName || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const sel = selectedCategory.toLowerCase();

    let matchesCategory = selectedCategory === 'All';
    if (!matchesCategory) {
      if (pCat === sel || (pCat && sel.includes(pCat)) || (pCat && pCat.includes(sel))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Beverages' && (pName.includes('coffee') || pName.includes('water') || pName.includes('milk') || pName.includes('latte') || pName.includes('juice') || pName.includes('tea'))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Snacks' && (pName.includes('bar') || pName.includes('crisps') || pName.includes('chocolate') || pName.includes('chips') || pName.includes('cookie') || pName.includes('snack'))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Dairy & Plant Milk' && (pName.includes('milk') || pName.includes('yogurt') || pName.includes('cheese') || pName.includes('butter') || pName.includes('oat'))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Bakery & Pastry' && (pName.includes('bread') || pName.includes('croissant') || pName.includes('pastry') || pName.includes('baguette') || pName.includes('muffin'))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Fresh Produce' && (pName.includes('apple') || pName.includes('banana') || pName.includes('berry') || pName.includes('fruit') || pName.includes('salad'))) {
        matchesCategory = true;
      } else if (selectedCategory === 'Nutrition & Supplements' && (pName.includes('protein') || pName.includes('matcha') || pName.includes('energy') || pName.includes('vitamin'))) {
        matchesCategory = true;
      }
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean((p as any).barcode && (p as any).barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pos-terminal-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top POS Header, Cambodia Clock & Shift Status Bar (Floating Glass Dock) */}
      <div
        className="ios-glass-panel pos-header-panel"
        style={{
          position: 'sticky',
          top: '12px',
          zIndex: 800,
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(20, 20, 26, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
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
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#FFFFFF', opacity: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
                POS Touchscreen Terminal
              </h2>
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

            {/* Phnom Penh Time & Active Cashier Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '12px', color: 'var(--ios-text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60A5FA', fontWeight: 600 }}>
                <Clock size={12} />
                {currentTime ? `Phnom Penh: ${currentTime}` : 'Phnom Penh (UTC+7)'}
              </span>
              <span>•</span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  backgroundColor: activeCashier ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: activeCashier ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  color: activeCashier ? '#38BDF8' : '#FCA5A5',
                  fontWeight: 700,
                  fontSize: '11px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: activeCashier ? '#10B981' : '#EF4444',
                    boxShadow: activeCashier ? '0 0 6px #10B981' : '0 0 6px #EF4444'
                  }}
                />
                <span>Cashier: {activeCashier ? `${activeCashier.fullName} (#${activeCashier.id})` : 'Register Locked'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher, Shift Drawer HUD & Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'space-between' }}>
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

            <button
              onClick={handleLockRegister}
              title="Close shift first to switch cashier"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                color: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Lock size={12} />
              <span>Lock / Switch Cashier</span>
            </button>
          </div>

          {/* Moved Profile and Sign Out to the Far Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Cashier Profile Capsule (Click to edit avatar and information) */}
            <button
              type="button"
              onClick={() => setShowCashierProfileModal(true)}
              title="Edit Cashier Profile & Avatar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 5px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '11px',
                  boxShadow: '0 2px 6px rgba(56, 189, 248, 0.3)'
                }}
              >
                {cashierAvatar ? (
                  <img
                    src={cashierAvatar}
                    alt={cashierProfileUser.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setCashierAvatar('')}
                  />
                ) : (
                  'CA'
                )}
              </div>
              <span>{activeCashier ? activeCashier.fullName.split(' ')[0] : 'Profile'}</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => {
                if (isShiftOpen) {
                  showError('Cannot sign out: Please close and reconcile your active shift first.');
                  setIsShiftModalOpen(true);
                  return;
                }
                setShowLogoutConfirm(true);
              }}
              title="Sign out of cashier session"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                color: '#FCA5A5',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        roleLabel="Cashier"
        userName={currentUser?.fullName || currentUser?.email}
        description="The cashier account will be signed out. Any open register work remains recorded on the server."
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          posService.lockRegister();
          logoutRole(currentUser?.role === 'ADMIN' ? 'ADMIN' : 'CASHIER');
          setShowLogoutConfirm(false);
        }}
      />

      <UserProfileModal
        isOpen={showCashierProfileModal}
        user={cashierProfileUser}
        roleLabel="POS Terminal Cashier"
        onClose={() => setShowCashierProfileModal(false)}
        onSave={handleSaveCashierProfile}
      />

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
        <div className="pos-main-layout">
          {/* Left Column: Fast Product Catalog & Barcode Scanner */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
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

                {/* Category Dropdown Selector */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      padding: '8px 36px 8px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      colorScheme: 'dark'
                    }}
                  >
                    {['All', 'Beverages', 'Snacks', 'Dairy & Plant Milk', 'Bakery & Pastry', 'Fresh Produce', 'Nutrition & Supplements'].map((cat) => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#18181B', color: '#FFFFFF' }}>
                        Category: {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Product Grid with REAL-TIME FIFO Stock Deduction on Cards */}
            <div className="pos-catalog-grid">
              {filteredProducts.map((product) => {
                // Real-time stock calculation across all batch preferences in cart
                const inCartQty = cart
                  .filter((it) => it.productId === product.id)
                  .reduce((sum, it) => sum + it.quantity, 0);
                const remainingStock = Math.max(0, product.availableStock - inCartQty);
                const isOutOfStock = remainingStock <= 0;

                // Near-expiry check (<1 month / 30 days) for perishable items
                const isNearExpiryUnderMonth = product.isPerishable && (() => {
                  const expStr = product.currentBatchExpiryDate;
                  if (!expStr) return false;
                  try {
                    const target = new Date(expStr).getTime();
                    const now = new Date().setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                  } catch {
                    return false;
                  }
                })();
                const clearancePrice = Math.round(product.retailPrice * 0.75 * 100) / 100;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product, 'FRESH')}
                    className="ios-glass-panel ios-glow-hover"
                    style={{
                      padding: '12px',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      minHeight: '275px',
                      height: '100%',
                      boxSizing: 'border-box',
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

                      {/* FEFO Tag on All Products */}
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

                      {/* View Detail Floating Pill Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductDetail(product);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          zIndex: 3,
                          transition: 'all 0.15s ease'
                        }}
                        title="View Product Details & Inventory Specs"
                      >
                        <Info size={11} /> Detail
                      </button>

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
                            : '0 in stock (FEFO)'
                          : `${remainingStock} in stock (FEFO)`}
                      </div>
                    </div>

                    {isNearExpiryUnderMonth ? (() => {
                      const clearanceInCart = cart.find((it) => it.productId === product.id && it.batchPreference === 'CLEARANCE')?.quantity || 0;
                      const clearanceStock = product.nearExpiryQuantity !== undefined ? product.nearExpiryQuantity : 10;
                      const isClearanceMaxed = clearanceInCart >= clearanceStock;

                      const freshInCart = cart.find((it) => it.productId === product.id && it.batchPreference !== 'CLEARANCE')?.quantity || 0;
                      const freshStock = product.freshStockQuantity !== undefined ? product.freshStockQuantity : Math.max(0, product.availableStock - clearanceStock);
                      const isFreshMaxed = freshInCart >= freshStock;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px', width: '100%' }}>
                          {/* Option 1: Fresh Batch */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                                ${product.retailPrice.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '9px', color: '#10B981', fontWeight: 700 }}>🌿 Fresh Batch</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductDetail(product);
                                }}
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="View Product Details"
                              >
                                <Eye size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfStock && !isFreshMaxed) handleAddToCart(product, 'FRESH');
                                }}
                                disabled={isOutOfStock || isFreshMaxed}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isOutOfStock || isFreshMaxed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: isFreshMaxed ? 'rgba(255, 255, 255, 0.4)' : '#10B981',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  cursor: isOutOfStock || isFreshMaxed ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title={isFreshMaxed ? `Normal batch limit reached (${freshStock} units)` : "Add Guaranteed Fresh Batch to Order"}
                              >
                                {isFreshMaxed ? `Max (${freshStock})` : <><Plus size={11} /> Fresh</>}
                              </button>
                            </div>
                          </div>

                          {/* Option 2: Second Choice Clearance (<1mo Expiring, 25% OFF) */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              border: '1px dashed rgba(245, 158, 11, 0.4)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FCD34D' }}>
                                  ${clearancePrice.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#F59E0B' }}>
                                  -25%
                                </span>
                              </div>
                              <div style={{ fontSize: '8px', color: '#FCD34D', fontWeight: 600 }}>
                                ⚠️ &lt;1 mo Clearance
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock && !isClearanceMaxed) handleAddToCart(product, 'CLEARANCE');
                              }}
                              disabled={isOutOfStock || isClearanceMaxed}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: isClearanceMaxed ? 'rgba(255, 255, 255, 0.1)' : '#F59E0B',
                                border: 'none',
                                color: isClearanceMaxed ? 'rgba(255, 255, 255, 0.4)' : '#000000',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: isOutOfStock || isClearanceMaxed ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title={isClearanceMaxed ? `Clearance batch limit reached (${clearanceStock} units)` : "Add Second Choice: Near-Expiry Clearance Batch (25% Discount)"}
                            >
                              {isClearanceMaxed ? `Max (${clearanceStock})` : <><Plus size={10} /> &lt;1mo</>}
                            </button>
                          </div>
                        </div>
                      );
                    })() : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', width: '100%', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                              ${product.retailPrice.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>Standard Shelf</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductDetail(product);
                              }}
                              style={{
                                padding: '3px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease'
                              }}
                              title="View Product Details"
                            >
                              <Eye size={11} /> Detail
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock) handleAddToCart(product, 'FRESH');
                              }}
                              disabled={isOutOfStock}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: isOutOfStock ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                border: 'none',
                                color: '#000000',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Add to Current Order"
                            >
                              <Plus size={11} /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: FIXED WIDTH Current Order & Tender Drawer (Width never expands on Desktop, adapts on Mobile) */}
          <div
            className="ios-glass-panel pos-cart-panel"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: 'fit-content'
            }}
          >
            {/* Cart Header with Full Opacity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="#38BDF8" style={{ opacity: 1, filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF', opacity: 1, textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>
                  Current Order
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
                    color: 'rgba(255, 255, 255, 0.75)',
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

            {/* Separate Batch Totals Breakdown on Product Cart */}
            {cart.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981', fontWeight: 800, fontSize: '11px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span>Normal Expiry:</span>
                  </div>
                  <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '12px', paddingLeft: '11px' }}>
                    {freshItemsQty} units • ${freshItemsTotal.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B', fontWeight: 800, fontSize: '11px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <span>&lt;1mo Clearance:</span>
                  </div>
                  <div style={{ color: '#FCD34D', fontWeight: 900, fontSize: '12px', paddingLeft: '11px' }}>
                    {clearanceItemsQty} units • ${clearanceItemsTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

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
                  const itemKey = `${item.productId}-${item.batchPreference || 'FRESH'}`;
                  return (
                    <div
                      key={itemKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: item.batchPreference === 'CLEARANCE' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                        border: item.batchPreference === 'CLEARANCE' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
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
                            objectFit: 'contain',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px',
                            marginRight: '8px',
                            flexShrink: 0
                          }}
                        />
                      )}

                      {/* Product Name & Unit Price with click to view detail */}
                      <div
                        onClick={() => {
                          if (prod) setSelectedProductDetail(prod);
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          paddingRight: '8px',
                          cursor: prod ? 'pointer' : 'default'
                        }}
                        title={prod ? `Click to view specs for ${item.name}` : undefined}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: item.batchPreference === 'CLEARANCE' ? '#FCD34D' : '#FFFFFF'
                          }}
                          title={item.name}
                        >
                          <span>{item.name}</span>
                          <Info size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: item.batchPreference === 'CLEARANCE' ? '#FBBF24' : '#F1F5F9',
                            opacity: 1
                          }}
                        >
                          ${item.retailPrice.toFixed(2)} ea {item.batchPreference === 'CLEARANCE' ? '• 25% OFF' : ''}
                        </div>
                      </div>

                      {/* Quantity Stepper with DIRECT TYPE-IN INPUT */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, -1, item.batchPreference)}
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
                          onChange={(e) => handleDirectQuantityInput(item.productId, e.target.value, item.batchPreference)}
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
                          onClick={() => handleUpdateQuantity(item.productId, 1, item.batchPreference)}
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

                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          width: '64px',
                          textAlign: 'right',
                          flexShrink: 0,
                          color: item.batchPreference === 'CLEARANCE' ? '#FCD34D' : '#FFFFFF',
                          opacity: 1,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
                        }}
                      >
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

            {/* Pricing Totals Box with Separate Totals for <1mo and Normal Expired */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              {/* Normal Shelf Stock Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34D399', fontSize: '12px', opacity: 1 }}>
                <span>🌿 Normal Stock ({freshItemsQty} items):</span>
                <span style={{ fontWeight: 800 }}>${freshItemsTotal.toFixed(2)}</span>
              </div>

              {/* Clearance <1mo Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FCD34D', fontSize: '12px' }}>
                <span>⚠️ &lt;1mo Clearance ({clearanceItemsQty} items):</span>
                <span style={{ fontWeight: 800 }}>${clearanceItemsTotal.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.15)', margin: '2px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF', opacity: 1 }}>
                <span style={{ fontWeight: 600 }}>Subtotal:</span>
                <span style={{ fontWeight: 800 }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', opacity: 1 }}>
                <span style={{ fontWeight: 600 }}>7% VAT Tax:</span>
                <span style={{ fontWeight: 700 }}>${taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.25)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#FFFFFF', opacity: 1, textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
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

                {/* Insufficient Cash Drawer Float Warning */}
                {isChangeExceedingDrawer && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#FCA5A5',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>
                      ⚠️ Insufficient cash in drawer: Only ${availableDrawerCash.toFixed(2)} float available (change due is ${changeDue.toFixed(2)}).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0 || isChangeExceedingDrawer}
              style={{
                padding: '16px',
                backgroundColor: (cart.length === 0 || isChangeExceedingDrawer) ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
                color: (cart.length === 0 || isChangeExceedingDrawer) ? 'rgba(0, 0, 0, 0.4)' : '#000000',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: (cart.length === 0 || isChangeExceedingDrawer) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: (cart.length > 0 && !isChangeExceedingDrawer) ? '0 10px 25px rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Receipt size={18} />
              {isProcessing
                ? 'Processing Transaction...'
                : isChangeExceedingDrawer
                ? `Insufficient Drawer Float ($${availableDrawerCash.toFixed(2)})`
                : `Charge $${grandTotal.toFixed(2)} & Print Receipt`}
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
          currentCashierName={activeCashier ? `${activeCashier.fullName} (ID #${activeCashier.id})` : activeShift?.cashierName}
          cashierId={activeCashier?.id}
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
        cashierName={activeCashier?.fullName}
        cashierId={activeCashier?.id}
        onClose={() => setIsShiftModalOpen(false)}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
      />

      {/* Floating Product Detail Modal */}
      <ProductDetailModal
        isOpen={selectedProductDetail !== null}
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddMultipleToCart}
        inCartQty={
          selectedProductDetail
            ? cart.filter((it) => it.productId === selectedProductDetail.id).reduce((s, it) => s + it.quantity, 0)
            : 0
        }
        inCartClearanceQty={
          selectedProductDetail
            ? cart.find((it) => it.productId === selectedProductDetail.id && it.batchPreference === 'CLEARANCE')?.quantity || 0
            : 0
        }
        inCartFreshQty={
          selectedProductDetail
            ? cart.find((it) => it.productId === selectedProductDetail.id && it.batchPreference !== 'CLEARANCE')?.quantity || 0
            : 0
        }
      />

      {/* Step 2: Cashier PIN Identification & Lock Screen Modal */}
      <CashierPinModal
        isOpen={isPinModalOpen}
        onSuccess={(cashier) => {
          setActiveCashier(cashier);
          const av = cashier.avatarUrl || localStorage.getItem(`aura_avatar_${cashier.id}`) || localStorage.getItem('aura_avatar_cashier') || '';
          setCashierAvatar(av);
          setIsPinModalOpen(false);
          posService.getCurrentShift(cashier.id)
            .then((shift) => setActiveShift(shift))
            .catch(() => setActiveShift(null));
        }}
        canCancel={Boolean(activeCashier)}
        onClose={() => {
          if (activeCashier) {
            setIsPinModalOpen(false);
          }
        }}
      />
    </div>
  );
};
export default CashierPosTerminal;

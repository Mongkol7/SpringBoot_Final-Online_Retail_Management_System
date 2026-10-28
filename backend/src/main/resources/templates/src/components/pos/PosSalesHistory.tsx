import React, { useState, useEffect, useMemo } from 'react';
import { PosSaleSummary, ThermalReceipt, PosShift } from '../../types/schema';
import { posService } from '../../services/posService';
import {
  Receipt,
  Search,
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  User,
  ShoppingBag,
  RotateCcw,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

interface PosSalesHistoryProps {
  onBackToTerminal: () => void;
  onViewReceipt: (receipt: ThermalReceipt) => void;
  currentCashierName?: string;
  cashierId?: number;
}

interface ShiftCardData {
  shift: PosShift;
  cashierName: string;
  cashierId: number;
  avatarUrl?: string | null;
  orders: PosSaleSummary[];
  grossSales: number;
  cashSales: number;
  cardSales: number;
  orderCount: number;
}

export const PosSalesHistory: React.FC<PosSalesHistoryProps> = ({
  onBackToTerminal,
  onViewReceipt,
  currentCashierName
}) => {
  const [sales, setSales] = useState<PosSaleSummary[]>([]);
  const [shifts, setShifts] = useState<PosShift[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'BY_SHIFT' | 'FLAT_ORDERS'>('BY_SHIFT');
  const [expandedShifts, setExpandedShifts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load shifts and sales for ALL cashiers together
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, shiftsData] = await Promise.all([
        posService.getSalesHistory('ALL'), // Retrieve ALL cashiers' sales
        posService.getAllShifts() // Retrieve ALL shifts
      ]);
      setSales(salesData);
      setShifts(shiftsData);

      // By default, expand all shifts so the user sees everything immediately
      const initialExpanded: Record<string, boolean> = {};
      shiftsData.forEach((s) => {
        initialExpanded[`shift-${s.id}`] = true;
      });
      initialExpanded['shift-unassigned'] = true;
      setExpandedShifts(initialExpanded);
    } catch (err) {
      console.error('Failed to load transaction & shift history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format date in Phnom Penh local time
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Convert YYYY-MM-DD from an ISO string
  const getIsoDateString = (isoStr?: string | null) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Quick period helper with active state guarantees
  const handleSelectQuickPeriod = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    if (period === 'TODAY') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    } else if (period === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const y = yesterday.getFullYear();
      const m = String(yesterday.getMonth() + 1).padStart(2, '0');
      const d = String(yesterday.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    } else {
      setSelectedDate('');
    }
  };

  // Filter sales based on selected date & query
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Date filter
      if (selectedDate) {
        const saleDateStr = getIsoDateString(s.createdAt);
        if (saleDateStr !== selectedDate) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrder = s.orderNumber?.toLowerCase().includes(query);
        const matchesCashier = s.cashierName?.toLowerCase().includes(query);
        const matchesCustomer = s.customerName?.toLowerCase().includes(query);
        const matchesItems = s.items?.some((it) => it.productName.toLowerCase().includes(query));
        return matchesOrder || matchesCashier || matchesCustomer || matchesItems;
      }
      return true;
    });
  }, [sales, selectedDate, searchQuery]);

  // Filter shifts based on selected date & query
  const filteredShifts = useMemo(() => {
    return shifts.filter((sh) => {
      // Date filter (matches either openedAt or closedAt)
      if (selectedDate) {
        const openDate = getIsoDateString(sh.openedAt);
        const closeDate = getIsoDateString(sh.closedAt);
        if (openDate !== selectedDate && closeDate !== selectedDate) {
          return false;
        }
      }

      // Search query (cashier name or shift id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCashier = sh.cashierName?.toLowerCase().includes(query);
        const matchesShiftId = `shift #${sh.id}`.includes(query) || String(sh.id).includes(query);
        return matchesCashier || matchesShiftId;
      }
      return true;
    });
  }, [shifts, selectedDate, searchQuery]);

  // Correct KPI Calculations across all loaded cashier transactions
  const totalRevenue = Math.round(
    filteredSales.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0) * 100
  ) / 100;
  const totalOrders = filteredSales.length;
  const cashTotal = Math.round(
    filteredSales
      .filter((s) => String(s.paymentMethod || '').toUpperCase() === 'CASH')
      .reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0) * 100
  ) / 100;
  const cardTransferTotal = Math.max(0, Math.round((totalRevenue - cashTotal) * 100) / 100);

  // Toggle shift accordion
  const toggleShiftExpand = (shiftKey: string) => {
    setExpandedShifts((prev) => ({
      ...prev,
      [shiftKey]: !prev[shiftKey]
    }));
  };

  // Group by Shift, ordered by most recent shift on top
  const { groupedShifts, unassignedOrders } = useMemo(() => {
    // Sort shifts: MOST RECENT SHIFT ON TOP
    const sortedShifts = [...filteredShifts].sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );

    const assignedSaleIds = new Set<number>();

    const shiftCards: ShiftCardData[] = sortedShifts.map((sh) => {
      const openTime = new Date(sh.openedAt).getTime();
      const closeTime = sh.closedAt ? new Date(sh.closedAt).getTime() : Date.now() + 60000;

      // Find orders matching this cashier & shift interval
      const matching = filteredSales.filter((sale) => {
        const matchesCashier =
          (sh.cashierId && sale.cashierId === sh.cashierId) ||
          (sh.cashierName && sale.cashierName && sale.cashierName.toLowerCase() === sh.cashierName.toLowerCase());

        if (!matchesCashier) return false;

        const saleTime = new Date(sale.createdAt).getTime();
        return saleTime >= openTime - 30000 && saleTime <= closeTime + 30000;
      });

      matching.forEach((m) => assignedSaleIds.add(m.id));

      const gross = Math.round(
        matching.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0) * 100
      ) / 100;
      const cash = Math.round(
        matching
          .filter((it) => String(it.paymentMethod || '').toUpperCase() === 'CASH')
          .reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0) * 100
      ) / 100;
      const card = Math.max(0, Math.round((gross - cash) * 100) / 100);

      const avatar = sh.cashierId ? localStorage.getItem(`aura_avatar_${sh.cashierId}`) : null;

      return {
        shift: sh,
        cashierName: sh.cashierName || 'Cashier Staff',
        cashierId: sh.cashierId,
        avatarUrl: avatar,
        orders: matching,
        grossSales: gross > 0 ? gross : Number(sh.systemCashTotal || 0),
        cashSales: cash > 0 ? cash : Number(sh.systemCashTotal || 0),
        cardSales: card,
        orderCount: matching.length > 0 ? matching.length : Number(sh.totalTransactions || 0)
      };
    });

    const unassigned = filteredSales.filter((o) => !assignedSaleIds.has(o.id));

    return { groupedShifts: shiftCards, unassignedOrders: unassigned };
  }, [filteredShifts, filteredSales]);

  // Open receipt with full freshness & clearance details from live backend
  const handleOpenReceipt = async (sale: PosSaleSummary) => {
    try {
      const realReceipt = await posService.getReceipt(sale.orderNumber);
      if (realReceipt && realReceipt.items && realReceipt.items.length > 0) {
        onViewReceipt(realReceipt);
        return;
      }
    } catch (e) {
      console.warn('Backend receipt fetch fallback:', e);
    }

    // High fidelity fallback matching fresh print out with clearance tags:
    const receipt: ThermalReceipt = {
      storeName: 'ONLINE RETAIL POS - STORE #01',
      terminalId: 'POS-TERM-01',
      cashierName: sale.cashierName || currentCashierName || 'POS Staff',
      orderNumber: sale.orderNumber,
      dateTime: formatDateTime(sale.createdAt),
      items: (sale.items || []).map((it) => {
        const isClearance = it.batchPreference === 'CLEARANCE' || it.productName.toLowerCase().includes('clearance');
        return {
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          batchPreference: isClearance ? 'CLEARANCE' : 'FRESH',
          isClearance,
          expiryDate: (it as any).expiryDate || undefined,
          expiryStatus: isClearance ? '<1 MO EXPIRING (25% CLEARANCE)' : 'NORMAL EXPIRY (GUARANTEED FRESH)'
        };
      }),
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      grandTotal: sale.totalAmount,
      amountTendered: sale.totalAmount,
      changeDue: 0,
      barcodeData: `RCP*${sale.orderNumber}*V1`
    };
    onViewReceipt(receipt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Controls Header */}
      <div
        className="ios-glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'rgba(20, 20, 26, 0.92)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToTerminal}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} /> Back to Terminal
          </button>
          <div>
            {/* Full Opacity Title with High Contrast */}
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFFFFF',
                opacity: 1,
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              POS Sales & Shift History
            </h2>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px', fontWeight: 600 }}>
              Grouped by Shift • Most Recent Shifts on Top • All Cashiers Audited
            </div>
          </div>
        </div>

        {/* Date Selector & Period Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Specific Date Picker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedDate ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
              padding: '6px 12px',
              borderRadius: '10px',
              border: selectedDate ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <Calendar size={14} color="#10B981" />
            <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 700 }}>Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedPeriod('CUSTOM');
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedPeriod('ALL');
                }}
                title="Clear date filter"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.85)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Period Pills with Vibrant Active Highlights */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' }
            ].map((tab) => {
              const isActive = selectedPeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectQuickPeriod(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.85)',
                    boxShadow: isActive ? '0 2px 8px rgba(255, 255, 255, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={loadData}
              title="Refresh sales and shifts"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#FFFFFF'
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('BY_SHIFT')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'BY_SHIFT' ? '#10B981' : 'transparent',
                color: activeTab === 'BY_SHIFT' ? '#000000' : 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.15s ease'
              }}
            >
              Grouped by Shift
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FLAT_ORDERS')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'FLAT_ORDERS' ? '#10B981' : 'transparent',
                color: activeTab === 'FLAT_ORDERS' ? '#000000' : 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.15s ease'
              }}
            >
              Flat Order Log
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards - Full Opacity & Sharp Typography */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div
          className="ios-glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: 'rgba(20, 20, 26, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.35)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gross POS Sales
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', opacity: 1 }}>
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: 'rgba(20, 20, 26, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.35)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
              color: '#60A5FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', opacity: 1 }}>
              {totalOrders} Transactions
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: 'rgba(20, 20, 26, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.25)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Banknote size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cash Collected
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', opacity: 1 }}>
              ${cashTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: 'rgba(20, 20, 26, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.35)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.25)',
              color: '#C084FC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Card / Transfer
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', opacity: 1 }}>
              ${cardTransferTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="ios-glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA' }}
          />
          <input
            type="text"
            placeholder="Search cashier name, order #, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
          {selectedDate ? (
            <span>Filtering date: <strong style={{ color: '#10B981' }}>{selectedDate}</strong> • </span>
          ) : null}
          Showing {filteredSales.length} orders across {groupedShifts.length} recorded shifts
        </div>
      </div>

      {/* VIEW 1: GROUPED BY SHIFT (Most Recent Shift on Top) */}
      {activeTab === 'BY_SHIFT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading ? (
            <div className="ios-glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#FFFFFF' }}>
              Loading shifts and transaction audit records...
            </div>
          ) : groupedShifts.length === 0 && unassignedOrders.length === 0 ? (
            <div className="ios-glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Receipt size={40} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#FFFFFF' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>No Cashier Shifts or Sales Found</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                {selectedDate ? `No records found for date ${selectedDate}.` : 'No walk-in POS transactions recorded yet.'}
              </div>
            </div>
          ) : (
            <>
              {groupedShifts.map((sData) => {
                const sh = sData.shift;
                const shiftKey = `shift-${sh.id}`;
                const isExpanded = !!expandedShifts[shiftKey];
                const isOpen = sh.status === 'OPEN';
                const initials = sData.cashierName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={sh.id}
                    className="ios-glass-panel"
                    style={{
                      borderRadius: '18px',
                      backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.08)' : 'rgba(24, 24, 27, 0.88)',
                      border: isOpen ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.14)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Shift Header with Cashier Info, Open/Close Times, Financials */}
                    <div
                      onClick={() => toggleShiftExpand(shiftKey)}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        flexWrap: 'wrap',
                        gap: '14px',
                        backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        {/* Cashier Avatar */}
                        {sData.avatarUrl ? (
                          <img
                            src={sData.avatarUrl}
                            alt={sData.cashierName}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '1px solid rgba(255, 255, 255, 0.25)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                              border: isOpen ? '1px solid #10B981' : '1px solid rgba(56, 189, 248, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              color: isOpen ? '#10B981' : '#38BDF8'
                            }}
                          >
                            {initials}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', opacity: 1 }}>
                              Shift #{sh.id}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                                color: isOpen ? '#10B981' : '#FFFFFF',
                                border: isOpen ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              {isOpen ? '● CURRENTLY OPEN' : 'CLOSED'}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#FFFFFF'
                              }}
                            >
                              Cashier: {sData.cashierName} {sData.cashierId ? `(#${sData.cashierId})` : ''}
                            </span>
                          </div>

                          {/* Shift Open & Close Timestamps */}
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} color="#10B981" />
                              <strong>Opened:</strong> {formatDateTime(sh.openedAt)}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} color={sh.closedAt ? '#EF4444' : '#F59E0B'} />
                              <strong>Closed:</strong> {sh.closedAt ? formatDateTime(sh.closedAt) : 'Ongoing active shift'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Shift Financial Badges (High Contrast, Turned Up Opacity) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Opening Float
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', opacity: 1 }}>
                            ${Number(sh.openingFloat || 0).toFixed(2)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Gross Revenue
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', opacity: 1 }}>
                            ${sData.grossSales.toFixed(2)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Cash in Drawer
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#F59E0B', opacity: 1 }}>
                            ${(Number(sh.openingFloat || 0) + (Number(sh.systemCashTotal) || sData.cashSales)).toFixed(2)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Transactions
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#60A5FA', opacity: 1 }}>
                            {sData.orderCount} sales
                          </div>
                        </div>

                        {sh.cashVariance !== null && sh.cashVariance !== undefined && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', fontWeight: 700 }}>
                              Variance
                            </div>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 900,
                                opacity: 1,
                                color: sh.cashVariance === 0 ? '#10B981' : sh.cashVariance < 0 ? '#EF4444' : '#FCD34D'
                              }}
                            >
                              {sh.cashVariance >= 0 ? `+$${sh.cashVariance.toFixed(2)}` : `-$${Math.abs(sh.cashVariance).toFixed(2)}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Orders inside this Shift (Expandable) */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 20px 18px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: 'rgba(0, 0, 0, 0.28)'
                        }}
                      >
                        {sData.orders.length === 0 ? (
                          <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                            No transaction orders recorded during this shift.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                                  <th style={{ padding: '10px 10px' }}>Order #</th>
                                  <th style={{ padding: '10px 10px' }}>Time</th>
                                  <th style={{ padding: '10px 10px' }}>Purchased Items</th>
                                  <th style={{ padding: '10px 10px' }}>Payment Method</th>
                                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Total</th>
                                  <th style={{ padding: '10px 10px', textAlign: 'center' }}>Receipt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sData.orders.map((sale) => (
                                  <tr
                                    key={sale.id}
                                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
                                  >
                                    <td style={{ padding: '12px 10px', fontWeight: 800, color: '#FFFFFF', opacity: 1 }}>
                                      {sale.orderNumber}
                                    </td>
                                    <td style={{ padding: '12px 10px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                                      {formatTimeOnly(sale.createdAt)}
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                      <div style={{ color: '#FFFFFF', fontWeight: 700 }}>
                                        {sale.totalItemsCount || sale.items?.length || 1} items
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {sale.items?.map((it) => `${it.quantity}x ${it.productName}${it.batchPreference === 'CLEARANCE' ? ' (Clearance <1mo)' : ''}`).join(', ')}
                                      </div>
                                    </td>
                                    {/* High Opacity Payment Method */}
                                    <td style={{ padding: '12px 10px' }}>
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: 800,
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          opacity: 1,
                                          backgroundColor:
                                            sale.paymentMethod === 'CASH'
                                              ? 'rgba(245, 158, 11, 0.25)'
                                              : 'rgba(59, 130, 246, 0.25)',
                                          color: sale.paymentMethod === 'CASH' ? '#FBBF24' : '#60A5FA',
                                          border: `1px solid ${sale.paymentMethod === 'CASH' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
                                        }}
                                      >
                                        {sale.paymentMethod}
                                      </span>
                                    </td>
                                    {/* High Opacity Total */}
                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#FFFFFF', opacity: 1, fontSize: '13px' }}>
                                      ${Number(sale.totalAmount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                      <button
                                        onClick={() => handleOpenReceipt(sale)}
                                        style={{
                                          padding: '5px 12px',
                                          borderRadius: '8px',
                                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                          border: '1px solid rgba(255, 255, 255, 0.25)',
                                          color: '#FFFFFF',
                                          fontSize: '11px',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}
                                      >
                                        <Receipt size={12} /> Print Receipt
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned orders (if any) */}
              {unassignedOrders.length > 0 && (
                <div
                  className="ios-glass-panel"
                  style={{
                    borderRadius: '18px',
                    backgroundColor: 'rgba(24, 24, 27, 0.88)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '16px 20px'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                    Other Walk-In POS Orders ({unassignedOrders.length})
                  </div>
                  <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                          <th style={{ padding: '8px 10px' }}>Order #</th>
                          <th style={{ padding: '8px 10px' }}>Date & Time</th>
                          <th style={{ padding: '8px 10px' }}>Cashier</th>
                          <th style={{ padding: '8px 10px' }}>Payment</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedOrders.map((sale) => (
                          <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '10px 10px', fontWeight: 800, color: '#FFFFFF' }}>{sale.orderNumber}</td>
                            <td style={{ padding: '10px 10px', color: 'rgba(255, 255, 255, 0.9)' }}>{formatDateTime(sale.createdAt)}</td>
                            <td style={{ padding: '10px 10px', color: '#FFFFFF' }}>{sale.cashierName || 'POS Staff'}</td>
                            <td style={{ padding: '10px 10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  backgroundColor: sale.paymentMethod === 'CASH' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                                  color: sale.paymentMethod === 'CASH' ? '#FBBF24' : '#60A5FA'
                                }}
                              >
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 900, color: '#FFFFFF' }}>
                              ${Number(sale.totalAmount).toFixed(2)}
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleOpenReceipt(sale)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW 2: FLAT ORDER LOG (Alternative View) */}
      {activeTab === 'FLAT_ORDERS' && (
        <div
          className="ios-glass-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', color: 'rgba(255, 255, 255, 0.85)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Order Number</th>
                  <th style={{ padding: '12px 14px' }}>Date & Time</th>
                  <th style={{ padding: '12px 14px' }}>Cashier Staff</th>
                  <th style={{ padding: '12px 14px' }}>Items</th>
                  <th style={{ padding: '12px 14px' }}>Payment</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: '#FFFFFF' }}>
                      <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <div>No POS sales recorded for selected filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#FFFFFF', opacity: 1 }}>
                        {sale.orderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} color="#10B981" />
                          {formatDateTime(sale.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#60A5FA" />
                          <span>{sale.cashierName || 'POS Staff'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 700 }}>
                          {sale.totalItemsCount || sale.items?.length || 1} items
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sale.items?.map((it) => `${it.quantity}x ${it.productName}${it.batchPreference === 'CLEARANCE' ? ' (Clearance <1mo)' : ''}`).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            opacity: 1,
                            backgroundColor:
                              sale.paymentMethod === 'CASH'
                                ? 'rgba(245, 158, 11, 0.25)'
                                : sale.paymentMethod === 'CARD'
                                ? 'rgba(59, 130, 246, 0.25)'
                                : 'rgba(168, 85, 247, 0.25)',
                            color:
                              sale.paymentMethod === 'CASH'
                                ? '#FBBF24'
                                : sale.paymentMethod === 'CARD'
                                ? '#60A5FA'
                                : '#C084FC',
                            border: `1px solid ${
                              sale.paymentMethod === 'CASH'
                                ? 'rgba(245, 158, 11, 0.45)'
                                : sale.paymentMethod === 'CARD'
                                ? 'rgba(59, 130, 246, 0.45)'
                                : 'rgba(168, 85, 247, 0.45)'
                            }`
                          }}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#FFFFFF', opacity: 1, fontSize: '13px' }}>
                        ${Number(sale.totalAmount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {sale.status || 'PAID'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenReceipt(sale)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Receipt size={12} /> Thermal Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default PosSalesHistory;

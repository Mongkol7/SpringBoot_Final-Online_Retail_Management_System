import React, { useState, useEffect } from 'react';
import { PosSaleSummary, ThermalReceipt } from '../../types/schema';
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
  ArrowLeft
} from 'lucide-react';

interface PosSalesHistoryProps {
  onBackToTerminal: () => void;
  onViewReceipt: (receipt: ThermalReceipt) => void;
  currentCashierName?: string;
}

export const PosSalesHistory: React.FC<PosSalesHistoryProps> = ({
  onBackToTerminal,
  onViewReceipt,
  currentCashierName
}) => {
  const [sales, setSales] = useState<PosSaleSummary[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('TODAY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSales = async (period: string) => {
    setIsLoading(true);
    try {
      const data = await posService.getSalesHistory(period);
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(selectedPeriod);
  }, [selectedPeriod]);

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesOrderNum = s.orderNumber?.toLowerCase().includes(query);
    const matchesCashier = s.cashierName?.toLowerCase().includes(query);
    const matchesCustomer = s.customerName?.toLowerCase().includes(query);
    const matchesItems = s.items?.some((it) => it.productName.toLowerCase().includes(query));
    return matchesOrderNum || matchesCashier || matchesCustomer || matchesItems;
  });

  // KPI calculations
  const totalRevenue = filteredSales.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
  const totalOrders = filteredSales.length;
  const cashTotal = filteredSales
    .filter((s) => s.paymentMethod === 'CASH')
    .reduce((acc, it) => acc + (it.totalAmount || 0), 0);
  const cardTransferTotal = totalRevenue - cashTotal;

  // Format date in Phnom Penh local time
  const formatDateTime = (dateStr: string) => {
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

  const handleOpenReceipt = (sale: PosSaleSummary) => {
    const receipt: ThermalReceipt = {
      storeName: 'ONLINE RETAIL POS - STORE #01',
      terminalId: 'POS-TERM-01',
      cashierName: sale.cashierName || currentCashierName || 'POS Staff',
      orderNumber: sale.orderNumber,
      dateTime: formatDateTime(sale.createdAt),
      items: sale.items.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal
      })),
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
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToTerminal}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>POS Sales & Transaction History</h2>
            <div style={{ fontSize: '12px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
              Real-time audit log of walk-in sales with FIFO fulfillment records
            </div>
          </div>
        </div>

        {/* Period Selector Pills */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'SHIFT', label: 'Current Shift' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'WEEK', label: 'Last 7 Days' },
            { id: 'ALL', label: 'All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedPeriod === tab.id ? '#FFFFFF' : 'transparent',
                color: selectedPeriod === tab.id ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => fetchSales(selectedPeriod)}
            title="Refresh sales list"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div
          className="ios-glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Gross POS Sales
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              {totalOrders} Transactions
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Banknote size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Cash Collected
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              ${cashTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div
          className="ios-glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#A855F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Card / Transfer
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              ${cardTransferTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Table Container */}
      <div
        className="ios-glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
            />
            <input
              type="text"
              placeholder="Search by Order #, Cashier Staff, Product Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ios-text-muted)' }}>
            Showing {filteredSales.length} of {sales.length} transactions
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ios-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Order Number</th>
                <th style={{ padding: '12px 14px' }}>Date & Time (Cambodia)</th>
                <th style={{ padding: '12px 14px' }}>Cashier Staff</th>
                <th style={{ padding: '12px 14px' }}>Items</th>
                <th style={{ padding: '12px 14px' }}>Payment</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                    Loading transaction records from PostgreSQL...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--ios-text-muted)' }}>
                    <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <div>No POS sales recorded for selected period ({selectedPeriod}).</div>
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
                    className="hover:bg-white/[0.03]"
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFFFFF' }}>
                      {sale.orderNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="#71717A" />
                        {formatDateTime(sale.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#71717A" />
                        <span>{sale.cashierName || 'Staff ID #1'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                        {sale.totalItemsCount || sale.items?.length || 1} items
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sale.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            sale.paymentMethod === 'CASH'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : sale.paymentMethod === 'CARD'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(168, 85, 247, 0.15)',
                          color:
                            sale.paymentMethod === 'CASH'
                              ? '#F59E0B'
                              : sale.paymentMethod === 'CARD'
                              ? '#60A5FA'
                              : '#C084FC'
                        }}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#FFFFFF' }}>
                      ${sale.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
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
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
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
    </div>
  );
};
export default PosSalesHistory;

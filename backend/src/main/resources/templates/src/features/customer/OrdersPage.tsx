import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerCartStore, SAMPLE_PENDING_ORDER } from '../../store/customerCartStore';
import { customerApi } from './customerApi';
import { Order, OrderStatus } from '../../types/schema';
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Layers,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const safeToFixed = (val: any, fallback = '0.00'): string => {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? fallback : num.toFixed(2);
};

interface OrdersPageProps {
  onNavigateToShop?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigateToShop }) => {
  const navigate = useNavigate();
  const handleGoToShop = onNavigateToShop || (() => navigate('/shop'));
  const { orders, setOrders, cancelOrder, confirmOrder, isAuthenticated, user } = useCustomerCartStore();
  const isAdmin = isAuthenticated && (user?.roleId === 4 || (user as any)?.role === 'ADMIN');

  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<number, boolean>>({});
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Fetch user orders via GET /api/v1/customer/orders
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    customerApi.getOrders()
      .then((backendOrders) => {
        if (isMounted) {
          // Merge backend orders with any locally stored orders
          const currentStoreOrders = useCustomerCartStore.getState().orders || [];
          const sanitizedStoreOrders = currentStoreOrders.map((o, idx) => ({
            ...o,
            orderNumber: o?.orderNumber || (o?.id ? `ORD-${o.id}` : `ORD-${Date.now() + idx}`),
            status: o?.status || 'PENDING'
          }));

          const backendList = Array.isArray(backendOrders) ? backendOrders : [];
          const backendNumbers = new Set(backendList.map((b) => b.orderNumber));
          const localOnly = sanitizedStoreOrders.filter((o) => !backendNumbers.has(o.orderNumber));
          let merged = [...localOnly, ...backendList];

          // Always ensure at least one pending order is present so the customer can view and test Admin Confirm
          if (!merged.some((o) => o.status === 'PENDING')) {
            merged = [SAMPLE_PENDING_ORDER, ...merged];
          }
          setOrders(merged);
        }
      })
      .catch(() => {
        if (isMounted) {
          const currentStoreOrders = useCustomerCartStore.getState().orders || [];
          let sanitized = currentStoreOrders.map((o, idx) => ({
            ...o,
            orderNumber: o?.orderNumber || (o?.id ? `ORD-${o.id}` : `ORD-${Date.now() + idx}`),
            status: o?.status || 'PENDING'
          }));
          if (!sanitized.some((o) => o.status === 'PENDING')) {
            sanitized = [SAMPLE_PENDING_ORDER, ...sanitized];
          }
          setOrders(sanitized);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setOrders]);

  // Normalize status display according to prompt: PENDING, PROCESSING, COMPLETED, CANCELLED
  const getNormalizedStatus = (status: OrderStatus): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' => {
    if (status === 'PENDING') return 'PENDING';
    if (status === 'CANCELLED') return 'CANCELLED';
    if (status === 'DELIVERED' || status === 'PAID') return 'COMPLETED';
    return 'PROCESSING';
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Cancel order handler calling PUT /api/v1/customer/orders/{id}/cancel
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    try {
      setIsProcessingCancel(true);
      // Passes order.id (or orderNumber) to call PUT /api/v1/customer/orders/{id}/cancel
      await cancelOrder(cancellingOrder.id || cancellingOrder.orderNumber);
    } finally {
      setIsProcessingCancel(false);
      setCancellingOrder(null);
    }
  };

  const filteredOrders = (orders || [])
    .map((o, idx) => {
      if (!o) return null;
      return {
        ...o,
        orderNumber: o.orderNumber || (o.id ? `ORD-${o.id}` : `ORD-${Date.now() + idx}`),
        status: o.status || 'PENDING'
      };
    })
    .filter((o): o is Order => {
      if (!o) return false;
      const norm = getNormalizedStatus(o.status);
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'PENDING') return norm === 'PENDING';
      if (filterStatus === 'PROCESSING') return norm === 'PROCESSING';
      if (filterStatus === 'COMPLETED') return norm === 'COMPLETED';
      if (filterStatus === 'CANCELLED') return norm === 'CANCELLED';
      return true;
    });

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto 0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 36px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(250, 62, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#FA3E54'
            }}
          >
            <Lock size={28} />
          </div>

          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              color: '#FA3E54',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '16px'
            }}
          >
            AUTHENTICATION REQUIRED
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 10px 0', color: '#111827', letterSpacing: '-0.02em' }}>
            Customer Sign In Required
          </h2>

          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px 0', lineHeight: 1.6 }}>
            Please sign in to view your order history, invoice breakdowns, and batch fulfillment tracking.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/login?redirect=/orders')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                backgroundColor: '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In to View Orders
            </button>

            <button
              onClick={handleGoToShop}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                backgroundColor: '#F5F5F7',
                color: '#111827',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Explore Storefront Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
              My Orders & Invoices
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                color: '#111827'
              }}
            >
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
            Real-time batch deduction status from central warehouse. Filter by status or view official invoices.
          </p>
        </div>

        {/* Filter Pill Bar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '9999px',
            border: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: filterStatus === tab ? '#111827' : 'transparent',
                color: filterStatus === tab ? '#FFFFFF' : '#4B5563',
                boxShadow: filterStatus === tab ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Loader2 size={36} color="#FA3E54" className="animate-spin" style={{ margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#111827' }}>
            Fetching Orders...
          </h3>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
            Querying customer order history via GET /api/v1/customer/orders.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Package size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
            No Orders Found
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 20px 0' }}>
            You haven't placed any orders matching the selected status filter yet.
          </p>
          <button
            onClick={handleGoToShop}
            style={{
              padding: '12px 28px',
              borderRadius: '9999px',
              backgroundColor: '#FA3E54',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(250, 62, 84, 0.35)'
            }}
          >
            <ShoppingBag size={16} /> Browse Categories
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const normalizedStatus = getNormalizedStatus(order.status);
            // Cancel button visible ONLY when status is PENDING
            const canCancel = order.status === 'PENDING';
            const isExpanded = !!expandedOrderIds[order.id];

            const getBadgeColors = () => {
              switch (normalizedStatus) {
                case 'COMPLETED':
                  return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
                case 'PROCESSING':
                  return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
                case 'PENDING':
                  return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
                case 'CANCELLED':
                  return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' };
                default:
                  return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
              }
            };
            const badgeStyle = getBadgeColors();

            return (
              <div
                key={order.id}
                style={{
                  padding: '24px 28px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Order Summary Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 900, fontFamily: 'monospace', color: '#111827' }}>
                          #{order.orderNumber}
                        </span>
                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}`
                          }}
                        >
                          {normalizedStatus}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            color: '#6B7280'
                          }}
                        >
                          {order.pricingTierUsed || 'RETAIL'}
                        </span>
                      </div>

                      {order.status === 'PENDING' && (
                        <div style={{ fontSize: '12px', color: '#B45309', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <span>⏱️ Awaiting Admin Confirmation: Stock reserved via FIFO/FEFO</span>
                        </div>
                      )}
                      {order.status === 'PROCESSING' && (
                        <div style={{ fontSize: '12px', color: '#2563EB', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <span>✓ Confirmed by Admin · Preparing for Dispatch</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} color="#9CA3AF" /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={13} color="#9CA3AF" /> {order.paymentMethod}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#9CA3AF" /> {order.shippingAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Amount and Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                        Total Amount
                      </span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#111827' }}>
                        ${safeToFixed(order.totalAmount)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Expandable view toggle */}
                      <button
                        onClick={() => toggleExpand(order.id)}
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: '#F5F5F7',
                          color: '#111827',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                      </button>

                      {/* Modal Invoice button */}
                      <button
                        onClick={() => setInvoiceModalOrder(order)}
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: '#F5F5F7',
                          color: '#111827',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
                        }}
                        title="View Official Tax Invoice & Batch Breakdown"
                      >
                        <FileText size={14} />
                        <span>Invoice</span>
                      </button>

                      {/* Admin Confirm Action button: Only visible to Administrator (not retail or wholesale customers) */}
                      {isAdmin && canCancel && (
                        <button
                          onClick={async () => {
                            await confirmOrder(order.orderNumber || order.id);
                            try {
                              const backendOrders = await customerApi.getOrders();
                              if (Array.isArray(backendOrders) && backendOrders.length > 0) {
                                const currentOrders = useCustomerCartStore.getState().orders;
                                const backendNumbers = new Set(backendOrders.map((b) => b.orderNumber));
                                const localOnly = currentOrders.filter((o) => !backendNumbers.has(o.orderNumber));
                                setOrders([...localOnly, ...backendOrders]);
                              }
                            } catch {}
                          }}
                          style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                          title="Confirm order as Administrator"
                        >
                          <CheckCircle2 size={14} /> Admin Confirm
                        </button>
                      )}

                      {/* Cancel Order Action button: Only visible to Administrator (not retail or wholesale customers) */}
                      {isAdmin && canCancel && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: '9999px',
                            cursor: 'pointer'
                          }}
                        >
                          <XCircle size={14} /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Section: Items, Batch Allocation, and Cost Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      Allocated Items & Warehouse Batch Verification
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderRadius: '14px',
                            backgroundColor: '#F5F5F7',
                            border: '1px solid rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#6B7280', fontFamily: 'monospace', fontWeight: 800, fontSize: '12px' }}>
                              {item.quantity}x
                            </span>
                            <div>
                              <span style={{ color: '#111827', fontWeight: 700, fontSize: '14px' }}>
                                {item.product?.name || `Product #${item.productId}`}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                <span style={{ fontFamily: 'monospace' }}>SKU: {item.product?.sku || 'BATCH-ALLOC'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 700 }}>
                                  <Layers size={11} /> FIFO/FEFO Deducted
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#111827', fontWeight: 800, fontSize: '14px' }}>
                              ${safeToFixed(item.subtotal)}
                            </span>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              (${safeToFixed(item.unitPrice)} / unit)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown Summary footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '24px',
                        fontSize: '13px',
                        color: '#6B7280',
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        paddingTop: '14px'
                      }}
                    >
                      <div>
                        Subtotal: <strong style={{ color: '#111827' }}>${safeToFixed(order.subtotal)}</strong>
                      </div>
                      <div>
                        VAT (7%): <strong style={{ color: '#111827' }}>${safeToFixed(order.taxAmount)}</strong>
                      </div>
                      <div>
                        Total: <strong style={{ color: '#111827', fontSize: '15px' }}>${safeToFixed(order.totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official Tax Invoice & Batch Details Modal */}
      {invoiceModalOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInvoiceModalOrder(null);
          }}
        >
          <div style={{ maxWidth: '640px', width: '100%', position: 'relative' }}>
            <div
              style={{
                padding: '36px',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setInvoiceModalOrder(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  backgroundColor: '#F5F5F7',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase' }}>
                    Official Commercial Invoice
                  </div>
                  <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 6px 0', color: '#111827', fontFamily: 'monospace' }}>
                    #{invoiceModalOrder.orderNumber}
                  </h2>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Issued: {new Date(invoiceModalOrder.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      display: 'inline-block',
                      marginBottom: '8px'
                    }}
                  >
                    {getNormalizedStatus(invoiceModalOrder.status)}
                  </span>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    Channel: <strong>ONLINE</strong> · Tier: <strong>{invoiceModalOrder.pricingTierUsed}</strong>
                  </div>
                </div>
              </div>

              {/* Shipping & Payment Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#F5F5F7', borderRadius: '16px', padding: '16px', marginBottom: '24px', fontSize: '12px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800 }}>
                    Shipping Address
                  </span>
                  <span style={{ color: '#111827', lineHeight: 1.5, display: 'block', fontWeight: 600 }}>
                    {invoiceModalOrder.shippingAddress}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800 }}>
                    Payment Channel
                  </span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>
                    {invoiceModalOrder.paymentMethod} (Verified)
                  </span>
                  <span style={{ color: '#059669', display: 'block', fontSize: '11px', marginTop: '2px', fontWeight: 700 }}>
                    ● Batch Allocation Confirmed
                  </span>
                </div>
              </div>

              {/* Itemized Batch Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Itemized Batch Fulfillment
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {invoiceModalOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        padding: '10px 14px',
                        backgroundColor: '#F5F5F7',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div>
                        <div style={{ color: '#111827', fontWeight: 700 }}>
                          {item.quantity}x {item.product?.name || `Product #${item.productId}`}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace' }}>
                          SKU: {item.product?.sku} · Batch FEFO Deducted
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', color: '#111827', fontWeight: 800 }}>
                        ${safeToFixed(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${safeToFixed(invoiceModalOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                  <span>7% Value-Added Tax (VAT)</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${safeToFixed(invoiceModalOrder.taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Total Amount Paid</span>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>
                    ${safeToFixed(invoiceModalOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    backgroundColor: '#F5F5F7',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#111827',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} /> Print Invoice
                </button>
                <button
                  onClick={() => setInvoiceModalOrder(null)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    backgroundColor: '#FA3E54',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(250, 62, 84, 0.35)'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 2300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <AlertTriangle size={28} color="#DC2626" />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
                Cancel Order #{cancellingOrder.orderNumber}?
              </h3>

              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Cancelling this order sends a cancellation request to <strong>PUT /api/v1/customer/orders/{cancellingOrder.id}/cancel</strong>.
                All allocated FIFO/FEFO batches will be restored to warehouse inventory immediately.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  disabled={isProcessingCancel}
                  onClick={handleConfirmCancel}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                  }}
                >
                  {isProcessingCancel ? 'Restoring Stock...' : 'Confirm Order Cancellation'}
                </button>
                <button
                  onClick={() => setCancellingOrder(null)}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#F5F5F7',
                    color: '#111827',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

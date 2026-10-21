import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosBadge, IosBadgeVariant } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
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
  const { orders, setOrders, cancelOrder, confirmOrder, isAuthenticated } = useCustomerCartStore();

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
        if (isMounted && Array.isArray(backendOrders)) {
          // Merge backend orders with any locally stored orders
          const currentStoreOrders = useCustomerCartStore.getState().orders || [];
          const backendNumbers = new Set(backendOrders.map((b) => b.orderNumber));
          const localOnly = currentStoreOrders.filter((o) => !backendNumbers.has(o.orderNumber));
          setOrders([...localOnly, ...backendOrders]);
        }
      })
      .catch(() => {})
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

  const getStatusBadgeVariant = (status: OrderStatus): IosBadgeVariant => {
    const norm = getNormalizedStatus(status);
    switch (norm) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
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

  const filteredOrders = (orders || []).filter((o) => {
    if (!o || !o.orderNumber) return false;
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
      <div style={{ maxWidth: '520px', margin: '40px auto 0 auto' }}>
        <IosCardGlass glow style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#FFFFFF'
            }}
          >
            <Lock size={30} />
          </div>

          <IosBadge variant="wholesale" style={{ marginBottom: '14px' }}>
            AUTHENTICATION REQUIRED
          </IosBadge>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px 0', color: '#FFFFFF' }}>
            Customer Sign In Required
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '0 0 28px 0', lineHeight: 1.6 }}>
            Please sign in to view your order history, invoice breakdowns, and batch fulfillment tracking.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <IosButton
              variant="primary"
              onClick={() => navigate('/login?redirect=/orders')}
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              Sign In to View Orders
            </IosButton>

            <IosButton
              variant="glass"
              onClick={handleGoToShop}
              style={{ width: '100%' }}
            >
              Explore Storefront Categories
            </IosButton>
          </div>
        </IosCardGlass>
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
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              My Orders & Invoices
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF'
              }}
            >
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '4px 0 0 0' }}>
            Real-time batch deduction status from central warehouse. Filter by status or view official invoices.
          </p>
        </div>

        {/* Filter Pill Bar */}
        <div
          className="ios-glass-capsule"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px'
          }}
        >
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: filterStatus === tab ? '#FFFFFF' : 'transparent',
                color: filterStatus === tab ? '#000000' : 'rgba(255, 255, 255, 0.7)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <IosCardGlass glow style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Loader2 size={36} color="#FFFFFF" className="animate-spin" style={{ margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Fetching Orders...
          </h3>
          <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', fontSize: '13px', margin: 0 }}>
            Querying customer order history via GET /api/v1/customer/orders.
          </p>
        </IosCardGlass>
      ) : filteredOrders.length === 0 ? (
        <IosCardGlass glow style={{ textAlign: 'center', padding: '70px 24px' }}>
          <Package size={48} color="#71717A" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            No Orders Found
          </h2>
          <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', fontSize: '14px', margin: '0 0 20px 0' }}>
            You haven't placed any orders matching the selected status filter yet.
          </p>
          <IosButton variant="primary" onClick={handleGoToShop}>
            <ShoppingBag size={16} /> Browse Categories
          </IosButton>
        </IosCardGlass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const normalizedStatus = getNormalizedStatus(order.status);
            // Cancel button visible ONLY when status is PENDING
            const canCancel = order.status === 'PENDING';
            const isExpanded = !!expandedOrderIds[order.id];

            return (
              <IosCardGlass key={order.id} glow style={{ padding: '24px 28px' }}>
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
                        <span style={{ fontSize: '17px', fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF' }}>
                          #{order.orderNumber}
                        </span>
                        {/* Status Badge: PENDING, PROCESSING, COMPLETED, CANCELLED */}
                        <IosBadge variant={getStatusBadgeVariant(order.status)} glow>
                          {order.status === 'PENDING' ? 'PENDING (Admin Confirm)' : normalizedStatus}
                        </IosBadge>
                        <IosBadge variant="wholesale">
                          {order.pricingTierUsed || 'RETAIL'}
                        </IosBadge>
                      </div>

                      {order.status === 'PENDING' && (
                        <div style={{ fontSize: '12px', color: '#FF9F0A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span>⏱️ Awaiting Admin Confirmation: Stock reserved via FIFO/FEFO</span>
                        </div>
                      )}
                      {order.status === 'PROCESSING' && (
                        <div style={{ fontSize: '12px', color: '#0A84FF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span>✓ Confirmed by Admin · Preparing for Dispatch</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={13} /> {order.paymentMethod}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} /> {order.shippingAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Amount and Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                        Total Amount
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                        ${safeToFixed(order.totalAmount)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Expandable view toggle */}
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="ios-glass-capsule ios-glow-hover"
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                      </button>

                      {/* Modal Invoice button */}
                      <button
                        onClick={() => setInvoiceModalOrder(order)}
                        className="ios-glass-capsule ios-glow-hover"
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="View Official Tax Invoice & Batch Breakdown"
                      >
                        <FileText size={14} />
                        <span>Invoice</span>
                      </button>

                      {/* Admin Confirm Action button: Visible when status is PENDING */}
                      {canCancel && (
                        <IosButton
                          variant="primary"
                          onClick={async () => {
                            await confirmOrder(order.id || order.orderNumber);
                            const updated = await customerApi.getOrders();
                            if (Array.isArray(updated) && updated.length > 0) setOrders(updated);
                          }}
                          style={{ fontSize: '12px', padding: '8px 14px' }}
                          title="Confirm order as Administrator"
                        >
                          <CheckCircle2 size={14} /> Admin Confirm
                        </IosButton>
                      )}

                      {/* Cancel Order Action button: Visible ONLY when status is PENDING */}
                      {canCancel && (
                        <IosButton
                          variant="danger"
                          onClick={() => setCancellingOrder(order)}
                          style={{ fontSize: '12px', padding: '8px 16px' }}
                        >
                          <XCircle size={14} /> Cancel Order
                        </IosButton>
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
                      borderTop: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-subtle, #71717A)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
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
                            padding: '10px 14px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'var(--ios-text-subtle, #71717A)', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>
                              {item.quantity}x
                            </span>
                            <div>
                              <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>
                                {item.product?.name || `Product #${item.productId}`}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ios-text-muted, #A1A1AA)', marginTop: '2px' }}>
                                <span style={{ fontFamily: 'monospace' }}>SKU: {item.product?.sku || 'BATCH-ALLOC'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#30D158' }}>
                                  <Layers size={11} /> FIFO/FEFO Deducted
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '13px' }}>
                              ${safeToFixed(item.subtotal)}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)' }}>
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
                        fontSize: '12px',
                        color: 'var(--ios-text-muted, #A1A1AA)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '12px'
                      }}
                    >
                      <div>
                        Subtotal: <strong style={{ color: '#FFFFFF' }}>${safeToFixed(order.subtotal)}</strong>
                      </div>
                      <div>
                        VAT (7%): <strong style={{ color: '#FFFFFF' }}>${safeToFixed(order.taxAmount)}</strong>
                      </div>
                      <div>
                        Total: <strong style={{ color: '#FFFFFF', fontSize: '14px' }}>${safeToFixed(order.totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </IosCardGlass>
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
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'var(--ios-blur-deep, blur(28px))',
            WebkitBackdropFilter: 'var(--ios-blur-deep, blur(28px))',
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
            <IosCardGlass glow style={{ padding: '36px' }}>
              {/* Close Button */}
              <button
                onClick={() => setInvoiceModalOrder(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
                className="ios-glow-hover"
              >
                <X size={16} />
              </button>

              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ios-text-subtle, #71717A)', textTransform: 'uppercase' }}>
                    Official Commercial Invoice
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 6px 0', color: '#FFFFFF', fontFamily: 'monospace' }}>
                    #{invoiceModalOrder.orderNumber}
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Issued: {new Date(invoiceModalOrder.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <IosBadge variant={getStatusBadgeVariant(invoiceModalOrder.status)} glow style={{ marginBottom: '8px' }}>
                    {getNormalizedStatus(invoiceModalOrder.status)}
                  </IosBadge>
                  <div style={{ fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)' }}>
                    Channel: <strong>ONLINE</strong> · Tier: <strong>{invoiceModalOrder.pricingTierUsed}</strong>
                  </div>
                </div>
              </div>

              {/* Shipping & Payment Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', padding: '16px', marginBottom: '24px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--ios-text-subtle, #71717A)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>
                    Shipping Address
                  </span>
                  <span style={{ color: '#FFFFFF', lineHeight: 1.5, display: 'block' }}>
                    {invoiceModalOrder.shippingAddress}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--ios-text-subtle, #71717A)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>
                    Payment Channel
                  </span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {invoiceModalOrder.paymentMethod} (Verified)
                  </span>
                  <span style={{ color: '#30D158', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                    ● Batch Allocation Confirmed
                  </span>
                </div>
              </div>

              {/* Itemized Batch Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ios-text-subtle, #71717A)', textTransform: 'uppercase', marginBottom: '10px' }}>
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
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '10px'
                      }}
                    >
                      <div>
                        <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                          {item.quantity}x {item.product?.name || `Product #${item.productId}`}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--ios-text-subtle, #71717A)', fontFamily: 'monospace' }}>
                          SKU: {item.product?.sku} · Batch FEFO Deducted
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', color: '#FFFFFF', fontWeight: 700 }}>
                        ${safeToFixed(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', marginBottom: '6px' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#FFFFFF' }}>${safeToFixed(invoiceModalOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', marginBottom: '10px' }}>
                  <span>7% Value-Added Tax (VAT)</span>
                  <span style={{ color: '#FFFFFF' }}>${safeToFixed(invoiceModalOrder.taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Total Amount Paid</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
                    ${safeToFixed(invoiceModalOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <IosButton
                  variant="glass"
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Printer size={14} /> Print Invoice
                </IosButton>
                <IosButton variant="primary" onClick={() => setInvoiceModalOrder(null)}>
                  Close
                </IosButton>
              </div>
            </IosCardGlass>
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
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'var(--ios-blur-deep, blur(28px))',
            WebkitBackdropFilter: 'var(--ios-blur-deep, blur(28px))',
            zIndex: 2300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <IosCardGlass glow style={{ padding: '32px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 69, 58, 0.12)',
                  border: '1px solid rgba(255, 69, 58, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <AlertTriangle size={28} color="#FF453A" />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
                Cancel Order #{cancellingOrder.orderNumber}?
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Cancelling this order sends a cancellation request to <strong>PUT /api/v1/customer/orders/{cancellingOrder.id}/cancel</strong>.
                All allocated FIFO/FEFO batches will be restored to warehouse inventory immediately.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <IosButton
                  variant="danger"
                  disabled={isProcessingCancel}
                  onClick={handleConfirmCancel}
                  style={{ flex: 1 }}
                >
                  {isProcessingCancel ? 'Restoring Stock...' : 'Confirm Order Cancellation'}
                </IosButton>
                <IosButton
                  variant="glass"
                  onClick={() => setCancellingOrder(null)}
                  style={{ flex: 1 }}
                >
                  Keep Order
                </IosButton>
              </div>
            </IosCardGlass>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

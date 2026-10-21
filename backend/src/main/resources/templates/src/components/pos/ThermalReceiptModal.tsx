import React from 'react';
import { ThermalReceipt } from '../../types/schema';
import { Printer, RotateCcw } from 'lucide-react';

interface ThermalReceiptModalProps {
  receipt: ThermalReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onNewSale
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Container - Styled as Authentic 80mm ESC/POS Monochromatic Thermal Paper */}
        <div
          id="printable-receipt"
          style={{
            width: '100%',
            backgroundColor: '#FAFAF9',
            color: '#18181B',
            borderRadius: '12px',
            padding: '28px 24px',
            fontFamily: '"Space Mono", "Courier New", Courier, monospace',
            fontSize: '13px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '0.05em' }}>
              {receipt.storeName}
            </h1>
            <p style={{ margin: '2px 0', fontSize: '11px', color: '#52525B' }}>123 RETAIL BOULEVARD, DISTRICT 1</p>
            <p style={{ margin: '2px 0', fontSize: '11px', color: '#52525B' }}>TEL: +1 (555) 019-8234 • VAT #US-778291</p>
            <div style={{ margin: '10px 0', borderBottom: '1px dashed #71717A' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#27272A' }}>
              <span>TERM: {receipt.terminalId}</span>
              <span>CASHIER: {receipt.cashierName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#27272A', marginTop: '2px' }}>
              <span>RCP: {receipt.orderNumber}</span>
              <span>{receipt.dateTime}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid #18181B', marginBottom: '8px' }} />

          {/* Table Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 56px 64px', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>
            <span>ITEM</span>
            <span style={{ textAlign: 'center' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>PRICE</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={{ borderBottom: '1px dashed #A1A1AA', marginBottom: '8px' }} />

          {/* Line Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {receipt.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 56px 64px', fontSize: '12px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>
                  {item.productName}
                </span>
                <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</span>
                <span style={{ textAlign: 'right', fontWeight: 600 }}>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: '1px dashed #71717A', margin: '12px 0 8px' }} />

          {/* Totals Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUBTOTAL:</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAT (7% INCL):</span>
              <span>${receipt.taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ borderBottom: '2px solid #18181B', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
              <span>TOTAL DUE:</span>
              <span>${receipt.grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ borderBottom: '1px dashed #71717A', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TENDERED (CASH):</span>
              <span>${receipt.amountTendered.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>CHANGE DUE:</span>
              <span>${receipt.changeDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div
              style={{
                height: '42px',
                background: 'repeating-linear-gradient(90deg, #18181B, #18181B 2px, transparent 2px, transparent 5px, #18181B 5px, #18181B 8px, transparent 8px, transparent 11px)',
                width: '85%',
                margin: '0 auto 6px auto'
              }}
            />
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#52525B' }}>
              *{receipt.barcodeData}*
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#71717A' }}>
            THANK YOU FOR YOUR PURCHASE!
            <br />
            KEEP RECEIPT FOR TAX & RETURN RECORDS (30 DAYS)
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              padding: '12px 18px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)'
            }}
          >
            <Printer size={16} />
            Print Receipt
          </button>

          <button
            onClick={onNewSale}
            style={{
              flex: 1,
              padding: '12px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RotateCcw size={16} />
            Next Customer
          </button>
        </div>
      </div>
    </div>
  );
};

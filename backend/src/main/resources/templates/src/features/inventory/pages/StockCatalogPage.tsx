import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  RefreshCw,
  Leaf,
  ArrowLeftRight,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { StockProduct } from '../../../services/inventoryService';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const StockCatalogPage: React.FC = () => {
  const {
    products,
    categories,
    productStock,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    showArchived,
    setShowArchived,
    openModal,
    toggleProductArchive
  } = useInventoryStore();

  const [pendingProduct, setPendingProduct] = useState<{ product: StockProduct; isRestore: boolean } | null>(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<StockProduct | null>(null);
  const [detailActiveImageIdx, setDetailActiveImageIdx] = useState(0);

  const liveProducts = products.filter((p) => showArchived || !p.isDeleted);

  const filteredProducts = liveProducts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === 'all' ||
      String(p.category?.id || p.categoryId) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const money = (v: number | undefined) => `$${Number(v || 0).toFixed(2)}`;

  const detailImages = selectedDetailProduct
    ? (selectedDetailProduct.images && selectedDetailProduct.images.length > 0
        ? selectedDetailProduct.images
        : selectedDetailProduct.imageUrl
        ? [selectedDetailProduct.imageUrl]
        : [])
    : [];

  return (
    <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
            PRODUCT MASTER DIRECTORY
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Catalog & Pricing Tiers
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF'
              }}
            >
              {filteredProducts.length} items
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: 0 }}>
            Master SKU directory, 3-tier pricing (Cost / Wholesale / Retail), reorder thresholds, and perishable rotation policies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => openModal('categories')}
            style={{
              padding: '9px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Tag size={14} />
            Categories
          </button>

          <button
            onClick={() => openModal('product')}
            style={{
              padding: '9px 18px',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: 'none',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)'
            }}
          >
            <Plus size={15} />
            Add Product
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          }}
        >
          <Search size={15} color="#71717A" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by SKU or title…"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '12px',
              width: '100%'
            }}
          />
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
          <button
            onClick={() => setCategoryFilter('all')}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: categoryFilter === 'all' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
              color: categoryFilter === 'all' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Categories
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(String(c.id))}
              style={{
                padding: '7px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: categoryFilter === String(c.id) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                color: categoryFilter === String(c.id) ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Show archived toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#A1A1AA',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            style={{ accentColor: '#FFFFFF', cursor: 'pointer' }}
          />
          Include Archived
        </label>
      </div>

      {/* Catalog Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#71717A', fontSize: '10px', letterSpacing: '0.08em' }}>
              <th style={{ padding: '12px 14px' }}>PRODUCT</th>
              <th style={{ padding: '12px 14px' }}>CATEGORY</th>
              <th style={{ padding: '12px 14px' }}>ON HAND STOCK</th>
              <th style={{ padding: '12px 14px' }}>PRICE TIERS (COST / WHOLESALE / RETAIL)</th>
              <th style={{ padding: '12px 14px' }}>THRESHOLD</th>
              <th style={{ padding: '12px 14px' }}>ROTATION</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              // Prefer the backend-calculated quantity so the stock controller and
              // storefront use the exact same active-batch/expiry rules.
              const onHand = product.stockQuantity !== undefined
                ? Number(product.stockQuantity)
                : (product.availableStock !== undefined ? Number(product.availableStock) : productStock(product.id));
              const isLow = onHand <= product.minStockThreshold;
              const hasMultipleImages = Boolean(product.images && product.images.length > 1);

              return (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    opacity: product.isDeleted ? 0.45 : 1,
                    textDecoration: product.isDeleted ? 'line-through' : 'none'
                  }}
                  className="ios-glow-hover"
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedDetailProduct(product);
                          setDetailActiveImageIdx(0);
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            overflow: 'hidden',
                            display: 'grid',
                            placeItems: 'center'
                          }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Package size={16} color="#71717A" />
                          )}
                        </div>
                        {hasMultipleImages && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-3px',
                              fontSize: '8px',
                              fontWeight: 800,
                              padding: '1px 4px',
                              borderRadius: '9999px',
                              background: '#FFFFFF',
                              color: '#000000',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                          >
                            +{product.images!.length - 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <b
                          onClick={() => {
                            setSelectedDetailProduct(product);
                            setDetailActiveImageIdx(0);
                          }}
                          style={{ color: '#FFFFFF', display: 'block', cursor: 'pointer' }}
                        >
                          {product.name}
                        </b>
                        <small style={{ color: '#71717A', fontFamily: 'monospace' }}>
                          {product.sku} {product.isDeleted ? '· ARCHIVED' : ''}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '11px'
                      }}
                    >
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b
                        style={{
                          fontSize: '14px',
                          color: isLow ? '#FFD60A' : '#FFFFFF'
                        }}
                      >
                        {onHand}
                      </b>
                      <small style={{ color: isLow ? '#FFD60A' : '#71717A' }}>
                        {isLow ? 'Low Stock' : 'units'}
                      </small>
                      {isLow && <AlertTriangle size={12} color="#FFD60A" />}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#71717A' }}>{money(product.costPrice)}</span>
                      <span style={{ color: '#52525B' }}>/</span>
                      <span style={{ color: '#A1A1AA' }}>{money(product.wholesalePrice)}</span>
                      <span style={{ color: '#52525B' }}>/</span>
                      <b style={{ color: '#FFFFFF' }}>{money(product.retailPrice)}</b>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>
                    {product.minStockThreshold} units
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: product.isPerishable ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.12)'
                      }}
                    >
                      {product.isPerishable ? <Leaf size={11} /> : <ArrowLeftRight size={11} />}
                      {product.isPerishable ? 'FEFO' : 'FIFO'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setSelectedDetailProduct(product);
                          setDetailActiveImageIdx(0);
                        }}
                        title={`View Details & Gallery for ${product.name}`}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        onClick={() => openModal('product', product)}
                        title={`Edit ${product.name}`}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        onClick={() =>
                          setPendingProduct({
                            product,
                            isRestore: Boolean(product.isDeleted)
                          })
                        }
                        title={product.isDeleted ? `Restore ${product.name}` : `Archive ${product.name}`}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: product.isDeleted ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 59, 48, 0.12)',
                          border: `1px solid ${product.isDeleted ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 59, 48, 0.25)'}`,
                          color: product.isDeleted ? '#FFFFFF' : '#FF453A',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {product.isDeleted ? <RefreshCw size={13} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#71717A' }}>
                  No products found. Add your first item or clear search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Details & Gallery Modal (Centered React Portal) */}
      {selectedDetailProduct &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
              overflowY: 'auto'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDetailProduct(null);
            }}
          >
            <div
              className="ios-glass-panel"
              style={{
                width: '100%',
                maxWidth: '720px',
                margin: 'auto',
                maxHeight: 'min(92vh, 850px)',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
                animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                      PRODUCT SPECIFICATION & GALLERY
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: selectedDetailProduct.isPerishable ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      {selectedDetailProduct.isPerishable ? <Leaf size={10} /> : <ArrowLeftRight size={10} />}
                      {selectedDetailProduct.isPerishable ? 'FEFO EXPIRY CONTROL' : 'FIFO NON-PERISHABLE'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
                    {selectedDetailProduct.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedDetailProduct.sku} · Category: {selectedDetailProduct.category?.name || 'General'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDetailProduct(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Photo Gallery with Thumbnail Selector */}
              <div
                style={{
                  marginBottom: '20px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px'
                }}
              >
                {/* Active Main Image */}
                <div
                  style={{
                    width: '100%',
                    height: '260px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#09090b',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative',
                    marginBottom: detailImages.length > 1 ? '12px' : '0'
                  }}
                >
                  {detailImages.length > 0 ? (
                    <img
                      src={detailImages[detailActiveImageIdx] || detailImages[0]}
                      alt={selectedDetailProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#71717A' }}>
                      <Package size={40} />
                      <span style={{ fontSize: '12px' }}>No images available for this product</span>
                    </div>
                  )}

                  {detailImages.length > 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700
                      }}
                    >
                      {detailActiveImageIdx + 1} / {detailImages.length}
                    </span>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {detailImages.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px' }}>
                    {detailImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDetailActiveImageIdx(idx)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: idx === detailActiveImageIdx ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.15)',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: idx === detailActiveImageIdx ? 1 : 0.65,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedDetailProduct.description && (
                <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--ios-text-muted)', lineHeight: '1.5' }}>
                  {selectedDetailProduct.description}
                </div>
              )}

              {/* 3 Pricing Tiers & Margins */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA', marginBottom: '10px' }}>
                  PRICING TIERS & MARGIN ANALYSIS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                    <small style={{ fontSize: '10px', color: '#71717A', display: 'block' }}>1. COST PRICE</small>
                    <b style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '2px', display: 'block' }}>
                      {money(selectedDetailProduct.costPrice)}
                    </b>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                    <small style={{ fontSize: '10px', color: '#71717A', display: 'block' }}>2. WHOLESALE</small>
                    <b style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '2px', display: 'block' }}>
                      {money(selectedDetailProduct.wholesalePrice)}
                    </b>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <small style={{ fontSize: '10px', color: '#A1A1AA', display: 'block' }}>3. RETAIL PRICE</small>
                    <b style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '2px', display: 'block' }}>
                      {money(selectedDetailProduct.retailPrice)}
                    </b>
                  </div>
                </div>

                {selectedDetailProduct.retailPrice > 0 && selectedDetailProduct.costPrice > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginTop: '10px' }}>
                    <span>
                      Gross Margin:{' '}
                      <b style={{ color: '#FFFFFF' }}>
                        {(((selectedDetailProduct.retailPrice - selectedDetailProduct.costPrice) / selectedDetailProduct.retailPrice) * 100).toFixed(1)}%
                      </b>
                    </span>
                    <span>
                      Markup:{' '}
                      <b style={{ color: '#FFFFFF' }}>
                        {(((selectedDetailProduct.retailPrice - selectedDetailProduct.costPrice) / selectedDetailProduct.costPrice) * 100).toFixed(1)}%
                      </b>
                    </span>
                  </div>
                )}
              </div>

              {/* Inventory Status Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA' }}>INVENTORY ON HAND</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {productStock(selectedDetailProduct.id)} units
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA' }}>MIN THRESHOLD</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#A1A1AA', marginTop: '2px' }}>
                    {selectedDetailProduct.minStockThreshold} units
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const prod = selectedDetailProduct;
                    setSelectedDetailProduct(null);
                    openModal('product', prod);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Pencil size={14} />
                  Edit Product
                </button>
                <button
                  onClick={() => setSelectedDetailProduct(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '14px',
                    background: '#FFFFFF',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete / Archive Confirmation Modal */}
      {pendingProduct && (
        <ConfirmDeleteModal
          isOpen={true}
          itemType="product"
          itemName={pendingProduct.product.name}
          itemSubtitle={`${pendingProduct.product.sku} · ${money(pendingProduct.product.retailPrice)} Retail`}
          isRestore={pendingProduct.isRestore}
          title={
            pendingProduct.isRestore
              ? `Reactivate Product: "${pendingProduct.product.name}"?`
              : `Light Delete Product: "${pendingProduct.product.name}"?`
          }
          confirmLabel={pendingProduct.isRestore ? 'Reactivate Product' : 'Light Delete (Safe Archive)'}
          onConfirm={async () => {
            const p = pendingProduct.product;
            setPendingProduct(null);
            await toggleProductArchive(p);
          }}
          onCancel={() => setPendingProduct(null)}
        />
      )}
    </div>
  );
};

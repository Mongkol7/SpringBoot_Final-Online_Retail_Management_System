import React from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

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
              const onHand = productStock(product.id);
              const isLow = onHand <= product.minStockThreshold;

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
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          overflow: 'hidden',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
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
                      <div>
                        <b style={{ color: '#FFFFFF', display: 'block' }}>{product.name}</b>
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
                        onClick={() => void toggleProductArchive(product)}
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
    </div>
  );
};

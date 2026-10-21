import React, { useState, useEffect, FormEvent } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

export const ProductModal: React.FC = () => {
  const {
    editingProduct,
    categories,
    closeModal,
    saveProduct,
    openModal,
    products
  } = useInventoryStore();

  const [sku, setSku] = useState(editingProduct?.sku || '');
  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(editingProduct?.imageUrl || '');
  const [categoryId, setCategoryId] = useState(
    editingProduct ? String(editingProduct.category?.id || editingProduct.categoryId || categories[0]?.id || '') : (categories[0] ? String(categories[0].id) : '')
  );
  const [costPrice, setCostPrice] = useState(editingProduct ? String(editingProduct.costPrice) : '2.00');
  const [wholesalePrice, setWholesalePrice] = useState(editingProduct ? String(editingProduct.wholesalePrice) : '3.00');
  const [retailPrice, setRetailPrice] = useState(editingProduct ? String(editingProduct.retailPrice) : '4.50');
  const [minStockThreshold, setMinStockThreshold] = useState(
    editingProduct ? String(editingProduct.minStockThreshold ?? 10) : '10'
  );
  // New products default to perishable, but existing products keep their saved setting.
  // Users can still switch this off before creating a non-perishable product.
  const [isPerishable, setIsPerishable] = useState(editingProduct ? Boolean(editingProduct.isPerishable) : true);
  const [isSaving, setIsSaving] = useState(false);

  const generateSku = (productName: string, selectedCategoryId: string) => {
    const slug = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'PRODUCT';
    return `SKU-${selectedCategoryId || 'NEW'}-${slug}`;
  };

  useEffect(() => {
    if (!editingProduct) setSku(generateSku(name, categoryId));
  }, [name, categoryId, editingProduct]);

  // Validate pricing contract: cost <= wholesale <= retail
  const numCost = parseFloat(costPrice) || 0;
  const numWholesale = parseFloat(wholesalePrice) || 0;
  const numRetail = parseFloat(retailPrice) || 0;
  const isPricingValid = numCost <= numWholesale && numWholesale <= numRetail;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPricingValid) {
      alert('Contract Violation: costPrice must be ≤ wholesalePrice, and wholesalePrice must be ≤ retailPrice.');
      return;
    }

    const duplicate = products.some((product) =>
      product.id !== editingProduct?.id &&
      (product.category?.id ?? product.categoryId) === Number(categoryId) &&
      product.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase() &&
      !product.isDeleted
    );
    if (duplicate) {
      alert('A product with this name already exists in the selected category.');
      return;
    }

    setIsSaving(true);
    await saveProduct({
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      categoryId: Number(categoryId) || (categories[0]?.id ?? 1),
      costPrice: numCost,
      wholesalePrice: numWholesale,
      retailPrice: numRetail,
      minStockThreshold: parseInt(minStockThreshold, 10) || 10,
      isPerishable
    });
    setIsSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
          animation: 'stock-enter 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
              {editingProduct ? 'CATALOG MASTER RECORD' : 'NEW PRODUCT REGISTRATION'}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={closeModal}
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
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Basic Details Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
                PRODUCT SKU <span style={{ color: '#FFFFFF' }}>*</span> {editingProduct && <small>(LOCKED)</small>}
              </label>
              <input
                value={sku}
                readOnly
                disabled
                placeholder="Generated automatically"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  background: editingProduct ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: editingProduct ? '#71717A' : '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#A1A1AA' }}>
                  CATEGORY <span style={{ color: '#FFFFFF' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => openModal('categories')}
                  style={{ background: 'transparent', border: 'none', color: '#A1A1AA', fontSize: '10px', cursor: 'pointer' }}
                >
                  Manage
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
              PRODUCT NAME <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Single Origin Nitro Cold Brew (330ml)"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
              IMAGE URL (OPTIONAL)
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              DESCRIPTION
            </label>
            <textarea
              rows={1}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product composition, specifications, and packaging..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* 3 Pricing Tiers Section */}
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isPricingValid ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 59, 48, 0.4)'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.06em' }}>
                3 PRICING TIERS (CONTRACT ENFORCEMENT)
              </div>
              <span
                style={{
                  fontSize: '10px',
                  color: isPricingValid ? '#A1A1AA' : '#FF453A',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {!isPricingValid && <AlertCircle size={12} />}
                cost ≤ wholesale ≤ retail
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
                  1. COST PRICE
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '11px', color: '#71717A', fontSize: '12px' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 10px 10px 24px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
                  2. WHOLESALE PRICE
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '11px', color: '#71717A', fontSize: '12px' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 10px 10px 24px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
                  3. RETAIL PRICE
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '11px', color: '#71717A', fontSize: '12px' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 10px 10px 24px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration: Min Stock & Perishable */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
                MIN REORDER THRESHOLD
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '0'
              }}
            >
              <div>
                <b style={{ fontSize: '12px', color: '#FFFFFF', display: 'block' }}>Perishable Good</b>
                <small style={{ fontSize: '9px', color: '#71717A' }}>Requires FEFO expiry intake</small>
              </div>

              <button
                type="button"
                onClick={() => setIsPerishable(!isPerishable)}
                style={{
                  width: '46px',
                  height: '26px',
                  borderRadius: '9999px',
                  background: isPerishable ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  padding: '3px'
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isPerishable ? '#000000' : '#FFFFFF',
                    transform: isPerishable ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={closeModal}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !isPricingValid}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: '14px',
                background: isPricingValid ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isPricingValid ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isPricingValid ? '0 4px 16px rgba(255, 255, 255, 0.2)' : 'none'
              }}
            >
              <Check size={16} />
              {isSaving ? 'Saving Product…' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

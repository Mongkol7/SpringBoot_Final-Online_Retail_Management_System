import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  AlertCircle,
  Upload,
  Trash2,
  Star,
  Image as ImageIcon
} from 'lucide-react';
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

  // Multi-image management: supports array of URLs and data URLs
  const initialImages: string[] = (() => {
    if (!editingProduct) return [];
    const prod = editingProduct as any;
    const list: string[] = [];
    const add = (url: any) => {
      if (!url || typeof url !== 'string') return;
      const u = url.trim();
      if (u === 'data:image/jpeg;base64' || u === 'data:image/png;base64' || u === 'data:image/webp;base64') return;
      if (u && !list.includes(u)) list.push(u);
    };
    if (prod.images) {
      if (Array.isArray(prod.images)) {
        prod.images.forEach(add);
      } else if (typeof prod.images === 'string') {
        const str = prod.images.trim();
        if (str.startsWith('data:')) {
          add(str);
        } else if (str.startsWith('[') && str.endsWith(']')) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) parsed.forEach(add);
          } catch {
            if (str.includes('data:')) {
              const cleaned = str.replace(/^[\[\s"']+|[\]\s"']+$/g, '');
              if (cleaned.startsWith('data:')) add(cleaned);
            } else {
              str.replace(/[\[\]"]/g, '').split(',').forEach(add);
            }
          }
        } else if (str.includes(',')) {
          str.split(',').forEach(add);
        } else if (str) {
          add(str);
        }
      }
    }
    if (prod.imageUrl && typeof prod.imageUrl === 'string') {
      const str = prod.imageUrl.trim();
      if (str.startsWith('data:')) {
        add(str);
      } else if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) parsed.forEach(add);
        } catch {
          add(str);
        }
      } else if (str.includes(',')) {
        str.split(',').forEach(add);
      } else if (str) {
        add(str);
      }
    }
    return list;
  })();

  const [images, setImages] = useState<string[]>(initialImages);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState(
    editingProduct
      ? String(editingProduct.category?.id || editingProduct.categoryId || categories[0]?.id || '')
      : categories[0]
      ? String(categories[0].id)
      : ''
  );
  const [costPrice, setCostPrice] = useState(editingProduct ? String(editingProduct.costPrice) : '2.00');
  const [wholesalePrice, setWholesalePrice] = useState(editingProduct ? String(editingProduct.wholesalePrice) : '3.00');
  const [retailPrice, setRetailPrice] = useState(editingProduct ? String(editingProduct.retailPrice) : '4.50');
  const [minStockThreshold, setMinStockThreshold] = useState(
    editingProduct ? String(editingProduct.minStockThreshold ?? 10) : '10'
  );
  const [isPerishable, setIsPerishable] = useState(editingProduct ? Boolean(editingProduct.isPerishable) : true);
  const [isSaving, setIsSaving] = useState(false);

  const generateSku = (productName: string, selectedCategoryId: string) => {
    const slug =
      productName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24) || 'PRODUCT';
    return `SKU-${selectedCategoryId || 'NEW'}-${slug}`;
  };

  useEffect(() => {
    if (!editingProduct) setSku(generateSku(name, categoryId));
  }, [name, categoryId, editingProduct]);

  // Handle local file uploads (multiple images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WebP, SVG).');
      return;
    }

    const readers = validFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result;
          if (typeof res === 'string') resolve(res);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      setImages((prev) => [...prev, ...dataUrls]);
    });

    e.target.value = '';
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

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

    const duplicate = products.some(
      (product) =>
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
      imageUrl: images[0] || '',
      images: images,
      categoryId: Number(categoryId) || (categories[0]?.id ?? 1),
      costPrice: numCost,
      wholesalePrice: numWholesale,
      retailPrice: numRetail,
      minStockThreshold: parseInt(minStockThreshold, 10) || 10,
      isPerishable
    });
    setIsSaving(false);
  };

  return createPortal(
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
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          margin: 'auto',
          maxHeight: 'min(92vh, 880px)',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
          animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Basic Details Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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

          {/* Multiple Images Management Section */}
          <div
            style={{
              padding: '14px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '0.08em', fontWeight: 800, color: '#A1A1AA' }}>
                  PRODUCT IMAGES & GALLERY
                </span>
                <span style={{ fontSize: '11px', color: '#71717A', marginLeft: '8px' }}>
                  ({images.length} {images.length === 1 ? 'image' : 'images'} added)
                </span>
              </div>
              <small style={{ fontSize: '10px', color: '#71717A' }}>
                First image is Primary Cover
              </small>
            </div>

            {/* Input Controls: URL + Upload from Device */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />

              <div
                style={{
                  flex: 1,
                  minWidth: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px'
                }}
              >
                <ImageIcon size={14} color="#71717A" />
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  placeholder="Paste image URL (e.g. https://...)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    width: '100%'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim()}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: urlInput.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                    color: urlInput.trim() ? '#000000' : '#71717A',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: urlInput.trim() ? 'pointer' : 'default'
                  }}
                >
                  Add URL
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={13} />
                Upload from Device
              </button>
            </div>

            {/* Thumbnail Preview Strip */}
            {images.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '10px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '4px'
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: idx === 0 ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: idx === 0 ? '0 0 12px rgba(255,255,255,0.2)' : 'none'
                    }}
                  >
                    <img
                      src={img}
                      alt={`Product preview ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                      }}
                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: '#FFFFFF',
                          color: '#000000',
                          fontSize: '8px',
                          fontWeight: 800
                        }}
                      >
                        COVER
                      </span>
                    )}

                    {/* Action buttons overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      {idx !== 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          title="Set as primary cover"
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Star size={11} />
                        </button>
                      ) : <span />}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove image"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          background: 'rgba(255, 59, 48, 0.85)',
                          border: 'none',
                          color: '#FFFFFF',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  color: '#71717A',
                  fontSize: '11px'
                }}
              >
                No images added. Paste an image URL or upload photos from your device.
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '4px' }}>
              DESCRIPTION
            </label>
            <textarea
              rows={2}
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
                  <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#71717A', fontSize: '12px' }}>$</span>
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
                      padding: '9px 10px 9px 24px',
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
                  <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#71717A', fontSize: '12px' }}>$</span>
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
                      padding: '9px 10px 9px 24px',
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
                  <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#71717A', fontSize: '12px' }}>$</span>
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
                      padding: '9px 10px 9px 24px',
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
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
    </div>,
    document.body
  );
};

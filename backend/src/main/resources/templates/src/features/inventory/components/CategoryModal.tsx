import React, { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { StockCategory } from '../../../services/inventoryService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const CategoryModal: React.FC = () => {
  const { categories, products, closeModal, createCategory, deleteCategory } = useInventoryStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<StockCategory | null>(null);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsAdding(true);
    const created = await createCategory(name.trim(), description.trim());
    if (created) {
      setName('');
      setDescription('');
    }
    setIsAdding(false);
  };

  return createPortal(
    <>
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
            maxWidth: '480px',
            margin: 'auto',
            maxHeight: 'min(90vh, 720px)',
            overflowY: 'auto',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
            animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                TAXONOMY DIRECTORY
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
                Product Categories
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

          {/* Add new category form */}
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New category title…"
                required
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isAdding}
                style={{
                  padding: '11px 18px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#A1A1AA',
                fontSize: '11px',
                outline: 'none'
              }}
            />
          </form>

          {/* Existing categories list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((c) => {
              const productCount = products.filter(
                (p) => (p.category?.id || p.categoryId) === c.id
              ).length;

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{c.name}</div>
                    <small style={{ fontSize: '10px', color: '#71717A' }}>
                      {productCount} items linked {c.description ? `• ${c.description}` : ''}
                    </small>
                  </div>

                  <button
                    onClick={() => setPendingDeleteCategory(c)}
                    title={`Delete category ${c.name}`}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      color: '#A1A1AA',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Category Light Delete */}
      {pendingDeleteCategory && (
        <ConfirmDeleteModal
          isOpen={true}
          itemType="category"
          itemName={pendingDeleteCategory.name}
          itemSubtitle={pendingDeleteCategory.description}
          title={`Light Delete Category: "${pendingDeleteCategory.name}"?`}
          confirmLabel="Light Delete (Safe Archive)"
          onConfirm={async () => {
            const cat = pendingDeleteCategory;
            setPendingDeleteCategory(null);
            await deleteCategory(cat);
          }}
          onCancel={() => setPendingDeleteCategory(null)}
        />
      )}
    </>,
    document.body
  );
};

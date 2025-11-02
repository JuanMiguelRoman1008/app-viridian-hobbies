"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  created_at?: string;
  updated_at?: string;
  set?: string;
  set_code?: string;
  number?: string;
  foil?: string;
  rarity?: string;
  tcgplayer_product_id?: string;
  photo_linked?: string;
  _raw?: Record<string, any> | null;
};

export default function InventoryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<InventoryItem>>({});
  const [deletingAll, setDeletingAll] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchInventory(); }, 300);
    return () => clearTimeout(t);
  }, [q, sortBy, sortDir]);

  const fetchInventory = async (p: number = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', String(pageSize));
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      if (q) params.set('q', q);

      const res = await fetch(`http://localhost:3001/inventory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const body = await res.json();
      setItems(body.data || []);
      setTotal(body.total || 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchInventory();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    fetchInventory(page);
  }, [page]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const startEdit = (it: InventoryItem) => {
    setEditingId(it.id);
    setEditingValues({ name: it.name, quantity: it.quantity, price: it.price });
  };

  const cancelEdit = () => { setEditingId(null); setEditingValues({}); };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/inventory/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingValues),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setItems(prev => prev.map(p => p.id === id ? updated : p));
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert('Error saving changes');
    }
  };

  const deleteItem = async (id: number) => {
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    try {
      const res = await fetch(`http://localhost:3001/inventory/${deleteItemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems(prev => prev.filter(p => p.id !== deleteItemId));
      setTotal(t => Math.max(0, t - 1));
      setShowDeleteModal(false);
      setDeleteItemId(null);
    } catch (e) {
      console.error(e);
      alert('Error deleting item');
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = e.target.files[0];
      setFile(selected);

      const formData = new FormData();
      formData.append("csvfile", selected);

      try {
        const response = await fetch("http://localhost:3001/upload/preview", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const rows = await response.json();
          sessionStorage.setItem('inventory_preview', JSON.stringify(rows));
          window.location.href = '/inventory/preprocess';
        } else {
          const text = await response.text();
          console.error('Preview failed', text);
          alert('Error parsing CSV: ' + response.statusText);
        }
      } catch (err) {
        console.error('Error previewing file', err);
        alert('Error previewing file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("csvfile", file);

    try {
      const response = await fetch("http://localhost:3001/upload/preview", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const rows = await response.json();
        sessionStorage.setItem('inventory_preview', JSON.stringify(rows));
        window.location.href = '/inventory/preprocess';
      } else {
        const text = await response.text();
        console.error('Preview failed', text);
        alert('Error parsing CSV: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const deleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch('http://localhost:3001/inventory/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_ALL_INVENTORY' }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Clear failed');
      }
      await fetchInventory(1);
      setPage(1);
      setShowDeleteAllModal(false);
    } catch (e) {
      console.error(e);
      alert('Error deleting inventory: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h1 className="text-2xl font-bold">Inventory System</h1>

        <section>
          <Card className="bg-blue-50">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">Import CSV</CardTitle>
              <div className="text-xs text-muted-foreground">Upload inventory CSV</div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />

                <div className="ml-0 flex items-center gap-2 sm:ml-auto">
                  <div className="text-sm text-muted-foreground">
                    {file ? file.name : 'No file selected'}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    onClick={(e) => {
                      if (!file) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload CSV"}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchInventory()}
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(true)}
                    disabled={deletingAll}
                    className="rounded border px-3 py-1 text-red-600 hover:bg-red-50"
                  >
                    Delete All
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
          <h2 className="text-lg font-semibold">Items</h2>
          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p>No items in inventory.</p>
          ) : (
            <div className="mt-2 overflow-auto">
              <div className="mb-2 flex items-center gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or id..." className="rounded border px-2 py-1 text-sm" />
              </div>

              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">ID</th>
                    <th className="border px-2 py-1 text-left">Photo</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => toggleSort('quantity')}>Quantity {sortBy==='quantity' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                    <th className="border px-2 py-1 text-left cursor-pointer" onClick={() => toggleSort('name')}>Card Name {sortBy==='name' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                    <th className="border px-2 py-1 text-left">Set</th>
                    <th className="border px-2 py-1 text-left">Set Code</th>
                    <th className="border px-2 py-1 text-left">Number</th>
                    <th className="border px-2 py-1 text-left">Foil</th>
                    <th className="border px-2 py-1 cursor-pointer" onClick={() => toggleSort('price')}>Unit Price {sortBy==='price' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                    <th className="border px-2 py-1 text-left">Rarity</th>
                    <th className="border px-2 py-1 text-left">TCGPlayer Product ID</th>
                    <th className="border px-2 py-1">Created</th>
                    <th className="border px-2 py-1">Updated</th>
                    <th className="border px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="odd:bg-white even:bg-gray-50 align-top">
                      <td className="border px-2 py-1 text-center align-top">{it.id}</td>
                      <td className="border px-2 py-1 align-top w-24">
                        {
                          (() => {
                            const set_code = (it as any).set_code;
                            const card_number = (it as any).number;
                            const tcg = (it as any).tcgplayer_product_id || (it as any).tcgplayer_id || (it as any).tcg;
                            let src: string | null = null;
                            if (set_code && card_number) {
                                src = `http://localhost:3001/image-database/branded/${set_code}/${card_number}.jpg`;
                            } else if (tcg) {
                                src = `https://tcgplayer-cdn.tcgplayer.com/product/${encodeURIComponent(String(tcg))}_in_1000x1000.jpg`;
                            }
                            if (!src) return <div className="text-xs text-muted-foreground">—</div>;
                            return (
                              <img
                                alt="thumb"
                                src={src}
                                className="h-16 w-16 object-contain rounded-md cursor-pointer"
                                onClick={() => {
                                  setModalSrc(src);
                                  requestAnimationFrame(() => setModalOpen(true));
                                }}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }}
                              />
                            );
                          })()
                        }
                      </td>

                      <td className="border px-2 py-1 text-center align-top">
                        {editingId === it.id ? (
                          <input className="w-16 text-sm text-center" value={String(editingValues.quantity ?? '')} onChange={(e) => setEditingValues(ev => ({ ...ev, quantity: Number(e.target.value) }))} />
                        ) : (
                          it.quantity
                        )}
                      </td>

                      <td className="border px-2 py-1 align-top">
                        {editingId === it.id ? (
                          <input className="w-full text-sm" value={editingValues.name ?? ''} onChange={(e) => setEditingValues(ev => ({ ...ev, name: e.target.value }))} />
                        ) : (
                          it.name
                        )}
                      </td>

                      <td className="border px-2 py-1 align-top text-sm">{(it as any).set ?? it._raw?.['Set'] ?? it._raw?.set ?? ''}</td>
                      <td className="border px-2 py-1 align-top text-sm">{(it as any).set_code ?? it._raw?.['Set Code'] ?? it._raw?.set_code ?? ''}</td>
                      <td className="border px-2 py-1 align-top text-sm">{(it as any).number ?? it._raw?.['Number'] ?? it._raw?.number ?? ''}</td>
                      <td className="border px-2 py-1 align-top text-sm">{(it as any).foil ?? it._raw?.['Foil'] ?? ''}</td>

                      <td className="border px-2 py-1 text-right align-top">
                        {editingId === it.id ? (
                          <input className="w-20 text-sm text-right" value={String(editingValues.price ?? '')} onChange={(e) => setEditingValues(ev => ({ ...ev, price: Number(e.target.value) }))} />
                        ) : (
                          `$${Number(it.price).toFixed(2)}`
                        )}
                      </td>

                      <td className="border px-2 py-1 align-top text-sm">{(it as any).rarity ?? it._raw?.['Rarity'] ?? ''}</td>
                      <td className="border px-2 py-1 align-top text-sm">{(it as any).tcgplayer_product_id ?? it._raw?.['TCGPlayer Product ID'] ?? ''}</td>

                      <td className="border px-2 py-1 text-xs align-top">{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</td>
                      <td className="border px-2 py-1 text-xs align-top">{it.updated_at ? new Date(it.updated_at).toLocaleString() : ''}</td>
                      <td className="border px-2 py-1 text-sm align-top">
                        {editingId === it.id ? (
                          <>
                            <button className="mr-2 rounded bg-green-600 px-2 py-1 text-white" onClick={() => saveEdit(it.id)}>Save</button>
                            <button className="rounded border px-2 py-1" onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="mr-2 rounded border px-2 py-1" onClick={() => startEdit(it)}>Edit</button>
                            <button className="rounded border px-2 py-1 text-red-600" onClick={() => deleteItem(it.id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Showing {(page-1)*pageSize + 1} - {Math.min(total, page*pageSize)} of {total}</div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded border px-3 py-1">Prev</button>
                  <div className="px-2 py-1">Page {page}</div>
                  <button onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))} className="rounded border px-3 py-1">Next</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Image Preview Modal */}
      {modalSrc && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${modalOpen ? 'opacity-100' : 'opacity-0'} bg-black/60 transition-opacity duration-200`}
          onClick={() => {
            setModalOpen(false);
            setTimeout(() => setModalSrc(null), 200);
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setModalOpen(false); setTimeout(() => setModalSrc(null), 200); } }}
          role="dialog"
          tabIndex={-1}
        >
          <img
            src={modalSrc}
            alt="preview"
            className={`max-h-[90vh] max-w-[90vw] shadow-lg transform transition-all duration-200 ${modalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />
        </div>
      )}

      {/* Delete Single Item Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Delete Item</h3>
            <p className="mb-6">Are you sure you want to delete item #{deleteItemId}? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItemId(null);
                }}
                className="rounded border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ Delete All Inventory</h3>
            <p className="mb-6">
              Are you sure you want to delete <strong>ALL {total} items</strong> from your inventory? 
              This action is <strong>permanent</strong> and cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="rounded border px-4 py-2 hover:bg-gray-50"
                disabled={deletingAll}
              >
                Cancel
              </button>
              <button
                onClick={deleteAll}
                disabled={deletingAll}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingAll ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
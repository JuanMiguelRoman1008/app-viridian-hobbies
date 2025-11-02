"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RawRow = Record<string, any>;

const CANONICAL_HEADERS = [
  'Quantity',
  'Card Name',
  'Set',
  'Set Code',
  'Number',
  'Foil',
  'Unit Price',
  'Total Price',
  'Custom Price',
  'TCGPlayer Product ID',
  'Artist',
  'Rarity',
  'Type Line',
  'Rules Text'
];

// Columns to hide from the on-screen mapped preview (but keep in mapping/import)
const HIDE_IN_PREVIEW = new Set([
  'Total Price',
  'Custom Price',
  'Artist',
  'Type Line',
  'Rules Text',
]);

const PREVIEW_HEADERS = CANONICAL_HEADERS.filter(h => !HIDE_IN_PREVIEW.has(h));

export default function PreprocessPage() {
  const [rows, setRows] = useState<RawRow[] | null>(null);
  const [editingRows, setEditingRows] = useState<RawRow[]>([]);
  // CSV is standardized; we don't need header mapping UI.
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('inventory_preview');
    if (raw) {
      try {
        const parsed: RawRow[] = JSON.parse(raw);
        setRows(parsed);

        // Auto-map detected headers to canonical headers using normalization and synonyms.
        const first = parsed[0] || {};
        const normalize = (s: string) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const normDetected: Record<string, string> = {};
        Object.keys(first).forEach(k => { normDetected[normalize(k)] = k; });

        const synonyms: Record<string, string[]> = {
          'Quantity': ['quantity', 'qty', 'count'],
          'Card Name': ['card name', 'cardname', 'name', 'card'],
          'Photo': ['photo', 'photo_linked', 'image', 'image_url', 'imageurl'],
          'Set': ['set'],
          'Set Code': ['set code','setcode'],
          'Number': ['number','no','num'],
          'Foil': ['foil'],
          'Unit Price': ['unit price','unitprice','custom price','customprice','price'],
          'Total Price': ['total price','totalprice'],
          'Custom Price': ['custom price','customprice'],
          'TCGPlayer Product ID': ['tcgplayer productid','tcgplayerproductid','tcg id','tcgplayer id','tcgplayerid'],
          'Artist': ['artist'],
          'Rarity': ['rarity'],
          'Type Line': ['type line','typeline'],
          'Rules Text': ['rules text','rulestext','text']
        };

        const autoMap: Record<string, string | null> = {};
        CANONICAL_HEADERS.forEach(ch => {
          let found: string | null = null;
          const syns = synonyms[ch] || [];
          const candidates = [ch, ...syns];
          for (const c of candidates) {
            const n = normalize(c);
            if (normDetected[n]) {
              found = normDetected[n];
              break;
            }
          }
          if (!found) {
            const exact = Object.keys(first).find(k => k.toLowerCase() === ch.toLowerCase());
            if (exact) found = exact;
          }
          autoMap[ch] = found;
        });

        // Transform rows to canonical-keyed objects so UI can read r['TCGPlayer Product ID'] etc.
        const canonicalRows = parsed.map(orig => {
          const out: RawRow = {};
          CANONICAL_HEADERS.forEach((ch) => {
            const detected = autoMap[ch];
            if (detected && orig[detected] !== undefined) out[ch] = orig[detected];
            else out[ch] = orig[ch] ?? null;
          });
          out._raw = orig;
          return out;
        });

        setEditingRows(canonicalRows);
      } catch (e) {
        setRows([]);
        setEditingRows([]);
      }
    } else {
      setRows([]);
      setEditingRows([]);
    }
  }, []);

  const updateCell = (rowIndex: number, header: string, value: string) => {
    setEditingRows(prev => {
      const copy = prev.slice();
      copy[rowIndex] = { ...copy[rowIndex], [header]: value };
      return copy;
    });
  };

  const handleImport = async () => {
    if (!editingRows || editingRows.length === 0) return;
    setImporting(true);
    try {
      // Build payload for backend import. Use canonical headers extracted earlier.
      const payload = editingRows.map((r) => {
        const out: Record<string, any> = {};
        CANONICAL_HEADERS.forEach((ch) => {
          out[ch] = r[ch] ?? null;
        });

        const quantityRaw = out['Quantity'];
        let quantity = parseInt((quantityRaw ?? '').toString().replace(/[^0-9.-]/g, ''), 10);
        if (isNaN(quantity)) quantity = 0;

        const unitRaw = out['Unit Price'] ?? out['Custom Price'] ?? out['Total Price'];
        let price = null;
        if (unitRaw !== undefined && unitRaw !== null && String(unitRaw).trim() !== '') {
          const s = String(unitRaw).replace(/[^0-9.-]/g, '');
          const f = parseFloat(s);
          if (!isNaN(f)) price = f;
        }

        return {
          name: String(out['Card Name'] ?? '') || '',
          quantity,
          price: price === null ? 0.0 : price,
          set: out['Set'] ?? null,
          set_code: out['Set Code'] ?? null,
          number: out['Number'] ?? null,
          foil: out['Foil'] ?? null,
          rarity: out['Rarity'] ?? null,
          tcgplayer_product_id: out['TCGPlayer Product ID'] ?? null,
          _raw: out._raw ?? out,
        };
      });

      const res = await fetch('http://localhost:3001/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage('Imported successfully — returning to inventory...');
        sessionStorage.removeItem('inventory_preview');
        setTimeout(() => { window.location.href = '/inventory'; }, 700);
      } else {
        const t = await res.text();
        setMessage('Import failed: ' + t);
      }
    } catch (e) {
      console.error(e);
      setMessage('Import error');
    } finally {
      setImporting(false);
    }
  };

  if (rows === null) return <p>Loading preview...</p>;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h1 className="text-2xl font-bold">Preprocess CSV</h1>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Preview & Edit</CardTitle>
            <div className="text-xs text-muted-foreground">Edit values and headers before importing</div>
          </CardHeader>
          <CardContent>
            {editingRows.length === 0 ? (
              <p>No rows found in preview.</p>
            ) : (
              <div className="space-y-4">
                {/* No header mapping UI: CSV is standardized */}

                <div>
                  <div className="text-sm font-medium mb-2">Mapped Preview</div>
                  <div className="overflow-auto">
                    <table className="w-full table-auto border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1">#</th>
                          <th className="border px-2 py-1 text-left">Photo</th>
                          {PREVIEW_HEADERS.map((h) => (
                            <th key={h} className="border px-2 py-1 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editingRows.slice(0, 200).map((r, idx) => (
                          <tr key={idx} className="odd:bg-white even:bg-gray-50 align-top">
                            <td className="border px-2 py-1 align-top">{idx + 1}</td>
                              <td className="border px-2 py-1 align-top w-24">
                                {
                                  (() => {
                                    const set_code = r['Set Code'];
                                    const card_number = r['Number'];
                                    const tcg = r['TCGPlayer Product ID'];
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
                              {PREVIEW_HEADERS.map((h) => (
                                <td key={h} className="border px-2 py-1 align-top">
                                  {h === 'Quantity' ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="rounded border px-2"
                                        onClick={() => {
                                          const current = parseInt(String(r['Quantity'] ?? '0').replace(/[^0-9.-]/g, ''), 10) || 0;
                                          updateCell(idx, 'Quantity', String(current - 1));
                                        }}
                                      >-</button>
                                      <input
                                        className="w-20 bg-transparent text-sm text-center"
                                        value={String(r['Quantity'] ?? '')}
                                        onChange={(e) => updateCell(idx, 'Quantity', e.target.value)}
                                      />
                                      <button
                                        className="rounded border px-2"
                                        onClick={() => {
                                          const current = parseInt(String(r['Quantity'] ?? '0').replace(/[^0-9.-]/g, ''), 10) || 0;
                                          updateCell(idx, 'Quantity', String(current + 1));
                                        }}
                                      >+</button>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">{String(r[h] ?? '')}</div>
                                  )}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {editingRows.length > 200 && (
                      <div className="text-xs text-muted-foreground mt-2">Showing first 200 rows — import will include all rows.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.history.back()}
                className="rounded border px-3 py-1"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || editingRows.length === 0}
                className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
              >
                {importing ? 'Importing...' : 'Import into Inventory'}
              </button>
            </div>
            {message && <div className="mt-3 text-sm">{message}</div>}
          </CardContent>
        </Card>
      </main>
        {modalSrc && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center ${modalOpen ? 'opacity-100' : 'opacity-0'} bg-black/60 transition-opacity duration-200`}
            onClick={() => {
              // play close animation
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
      </div>
  );
}
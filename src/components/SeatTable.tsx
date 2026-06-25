import { useRef, useState } from 'react';
import { RoleArt } from './RoleArt';
import type { Player } from '../types';

export type TableView = 'circle' | 'square';

interface Props {
  players: Player[];
  seatOrder: number[];          // display order of seat numbers
  view: TableView;
  zoom: number;
  rearrange: boolean;
  votes?: Record<number, number>;
  targeted: Set<number>;
  selected: number | null;
  runoff?: number[];
  onTap: (p: Player) => void;
  onReorder: (order: number[]) => void;
  label: (p: Player) => string;
}

const BASE = 320;

/** Position (fraction 0..1) of slot i of n, for the chosen layout. */
function slotPos(i: number, n: number, view: TableView): { x: number; y: number } {
  if (view === 'circle') {
    const R = 0.38;
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: 0.5 + R * Math.cos(a), y: 0.5 + R * Math.sin(a) };
  }
  // square: seats spread evenly around a rounded-rect perimeter
  const lo = 0.12, hi = 0.88, seg = hi - lo, perim = 4 * seg;
  const d = ((i + 0.5) / n) * perim; // half-step offset keeps seats off the corners
  if (d < seg) return { x: lo + d, y: lo };
  if (d < 2 * seg) return { x: hi, y: lo + (d - seg) };
  if (d < 3 * seg) return { x: hi - (d - 2 * seg), y: hi };
  return { x: lo, y: hi - (d - 3 * seg) };
}

function adjacentFrac(n: number, view: TableView): number {
  if (view === 'circle') return 2 * Math.sin(Math.PI / n) * 0.38;
  return (4 * 0.76) / n;
}

export function SeatTable(props: Props) {
  const { players, seatOrder, view, zoom, rearrange, votes, targeted, selected, runoff, onTap, onReorder, label } = props;
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragSeat, setDragSeat] = useState<number | null>(null);
  const [dragPt, setDragPt] = useState<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<number[] | null>(null);

  const order = (preview ?? seatOrder).filter((s) => players.some((p) => p.seat === s));
  const n = order.length || 1;
  const D = Math.round(BASE * zoom);
  const seatPx = Math.max(24, Math.min(60, Math.round(adjacentFrac(n, view) * 0.82 * D)));
  const bySeat = (s: number) => players.find((p) => p.seat === s)!;

  const ptFrac = (clientX: number, clientY: number) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
  };
  const nearestSlot = (fx: number, fy: number) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const p = slotPos(i, n, view);
      const d = (p.x - fx) ** 2 + (p.y - fy) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };

  const onDown = (e: React.PointerEvent, seat: number) => {
    if (!rearrange) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragSeat(seat);
    setDragPt(ptFrac(e.clientX, e.clientY));
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragSeat == null) return;
    const f = ptFrac(e.clientX, e.clientY);
    setDragPt(f);
    const without = seatOrder.filter((s) => s !== dragSeat);
    const idx = Math.min(nearestSlot(f.x, f.y), without.length);
    const next = [...without.slice(0, idx), dragSeat, ...without.slice(idx)];
    setPreview(next);
  };
  const onUp = () => {
    if (dragSeat != null && preview) onReorder(preview);
    setDragSeat(null); setDragPt(null); setPreview(null);
  };

  return (
    <div className="table-scroll">
      <div
        ref={boxRef}
        className={'seat-table' + (view === 'square' ? ' square' : '')}
        style={{ width: D, height: D }}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <div className="table-center">{view === 'square' ? <div className="table-surface" /> : null}</div>

        {order.map((seat, i) => {
          const p = bySeat(seat);
          const pos = slotPos(i, n, view);
          const dragging = dragSeat === seat;
          const here = dragging && dragPt ? dragPt : pos;
          const inRunoff = runoff?.includes(seat);
          const dim = runoff && !p.dead && !inRunoff;
          const cls = 'tseat'
            + (p.dead ? ' dead' : '')
            + (targeted.has(seat) ? ' targeted' : '')
            + (selected === seat ? ' selected' : '')
            + (votes && !p.dead ? ' votable' : '')
            + (inRunoff ? ' runoff' : '')
            + (dim ? ' dim' : '')
            + (dragging ? ' dragging' : '')
            + (rearrange ? ' grab' : '');
          const vc = votes?.[seat] ?? 0;
          return (
            <div
              key={seat}
              className={cls}
              style={{ left: `${here.x * 100}%`, top: `${here.y * 100}%`, width: seatPx + 16, zIndex: dragging ? 20 : undefined }}
              onPointerDown={(e) => onDown(e, seat)}
              onClick={() => !rearrange && onTap(p)}
            >
              {vc > 0 && <span className="vote-badge">{vc}</span>}
              {rearrange && <span className="seat-num-chip">{seat}</span>}
              {p.name?.trim() && (
                <span className="pname" style={{ maxWidth: seatPx + 26 }}>{p.name.trim()}</span>
              )}
              <RoleArt roleId={p.roleId} size={seatPx} />
              {seatPx >= 34 && <span className="nm">{label(p)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

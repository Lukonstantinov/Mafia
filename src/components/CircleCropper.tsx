import { useEffect, useRef, useState } from 'react';
import { useT } from './ui';

const VIEW = 280;   // on-screen circular viewport (px)
const OUT = 320;    // exported image size (px)

/**
 * Circular image cropper. Pick an image, pan (drag) and zoom (slider/pinch)
 * inside the circle, then save — the circle is exported as a transparent PNG.
 */
export function CircleCropper({ title, onSave, onClose }: {
  title: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // baseline "cover" scale so the image fills the circle at zoom 1
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const dispW = img ? img.naturalWidth * base * zoom : 0;
  const dispH = img ? img.naturalHeight * base * zoom : 0;

  const pick = (file: File) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); setZoom(1); setPos({ x: 0, y: 0 }); };
    im.src = url;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => { drag.current = null; };

  // pinch-zoom on touch
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.current) { pinch.current = { d, z: zoom }; return; }
    setZoom(Math.max(1, Math.min(5, pinch.current.z * (d / pinch.current.d))));
  };
  const onTouchEnd = () => { pinch.current = null; };

  const save = () => {
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = OUT; c.height = OUT;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, OUT, OUT);
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    const k = OUT / VIEW;
    const w = dispW * k, h = dispH * k;
    const cx = OUT / 2 + pos.x * k, cy = OUT / 2 + pos.y * k;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
    onSave(c.toDataURL('image/png'));
  };

  useEffect(() => () => { /* nothing to clean */ }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal fadein" style={{ maxWidth: 360 }}>
        <h2>{title}</h2>
        <input
          ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
        />

        {!img ? (
          <button className="btn primary" style={{ marginTop: 16 }} onClick={() => fileRef.current?.click()}>
            📷 {t('crop_pick')}
          </button>
        ) : (
          <>
            <div
              className="crop-view"
              style={{ width: VIEW, height: VIEW }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={img.src}
                draggable={false}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: dispW, height: dispH,
                  transform: `translate(-50%,-50%) translate(${pos.x}px,${pos.y}px)`,
                  userSelect: 'none', touchAction: 'none',
                }}
              />
              <div className="crop-ring" />
            </div>

            <div className="row" style={{ alignItems: 'center', gap: 10, marginTop: 12 }}>
              <span className="mute" style={{ fontSize: 16 }}>−</span>
              <input
                type="range" min={1} max={5} step={0.02} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="mute" style={{ fontSize: 16 }}>＋</span>
            </div>

            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
              {t('crop_change')}
            </button>
          </>
        )}

        <div className="col" style={{ marginTop: 14 }}>
          <button className="btn primary" disabled={!img} onClick={save}>{t('crop_save')}</button>
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

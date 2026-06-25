import { useRef, useState } from 'react';
import { useStore } from '../store';
import { useT, roleName, useRoleById } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';

export function NightOrder() {
  const t = useT();
  const setup = useStore((s) => s.setup);
  const roleById = useRoleById();
  const setNightOrder = useStore((s) => s.setNightOrder);
  const go = useStore((s) => s.go);

  // only acting roles that exist as defs
  const order = setup.nightOrder.filter((id) => roleById[id]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
    setDragY(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    setDragY(e.clientY);
    // find which item we're hovering over
    const idx = order.indexOf(dragId);
    for (let i = 0; i < order.length; i++) {
      if (order[i] === dragId) continue;
      const el = itemRefs.current[order[i]];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if ((i < idx && e.clientY < mid) || (i > idx && e.clientY > mid)) {
        const next = order.filter((x) => x !== dragId);
        next.splice(i, 0, dragId);
        setNightOrder(next);
        break;
      }
    }
  };

  const onPointerUp = () => setDragId(null);

  return (
    <div className="screen fadein" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <TopBar onBack={() => go('setup')} />
      <h1 style={{ fontSize: 24 }}>{t('no_title')}</h1>
      <p className="mute" style={{ marginTop: 4 }}>{t('no_sub')}</p>

      <div className="list" style={{ marginTop: 14 }}>
        <div className="no-item pinned">
          <span className="grip">☾</span>
          <span className="nm">{t('no_citySleeps')}</span>
        </div>

        {order.map((id) => {
          const role = roleById[id];
          const dragging = dragId === id;
          return (
            <div
              key={id}
              ref={(el) => { itemRefs.current[id] = el; }}
              className={'no-item' + (dragging ? ' dragging' : '')}
              style={dragging ? { transform: `translateY(${0}px)`, position: 'relative', zIndex: 5 } : undefined}
            >
              <span
                className="grip"
                style={{ touchAction: 'none', cursor: 'grab' }}
                onPointerDown={(e) => onPointerDown(e, id)}
              >⠿</span>
              <RoleArt roleId={id} size={32} />
              <span className="nm">{roleName(role, t)}</span>
            </div>
          );
        })}

        <div className="no-item pinned">
          <span className="grip">⚖</span>
          <span className="nm">{t('no_cityVote')}</span>
        </div>
      </div>

      <div className="spacer" />
      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => go('setup')}>{t('done')}</button>
      {dragId && <input type="hidden" value={dragY} readOnly />}
    </div>
  );
}

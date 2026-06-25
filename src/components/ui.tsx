import { useEffect, useMemo, type ReactNode } from 'react';
import { useStore } from '../store';
import { makeT, type TKey } from '../i18n';
import type { RoleDef } from '../types';

/** i18n hook bound to the persisted language. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return makeT(lang) as (k: TKey) => string;
}

/**
 * Memoized roleId -> RoleDef map. Selecting a freshly-built object straight
 * from the store each render breaks Zustand's snapshot caching, so derive it
 * from the stable roleDefs reference here instead.
 */
export function useRoleById(): Record<string, RoleDef> {
  const roleDefs = useStore((s) => s.roleDefs);
  return useMemo(() => {
    const m: Record<string, RoleDef> = {};
    for (const r of roleDefs) m[r.id] = r;
    return m;
  }, [roleDefs]);
}

/** Ordered roleIds that act at night and are actually in play (memoized). */
export function useNightSteps(): string[] {
  const setup = useStore((s) => s.setup);
  return useMemo(
    () => setup.nightOrder.filter((id) => (setup.counts[id] ?? 0) > 0),
    [setup],
  );
}

/** Localized role name: built-ins translate by id, custom roles use typed text. */
export function roleName(role: RoleDef | undefined, t: (k: TKey) => string): string {
  if (!role) return '';
  return role.builtin ? t(`role_${role.id}` as TKey) : role.name;
}

export function roleDesc(role: RoleDef | undefined, t: (k: TKey) => string): string {
  if (!role) return '';
  return role.builtin ? t(`role_${role.id}_desc` as TKey) : role.desc;
}

export function Stepper({ value, onChange, min = 0, max = 30 }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="decrease">−</button>
      <span className="stepper-val">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="increase">+</button>
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="knob" />
    </button>
  );
}

export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="close">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Modal({ open, title, body, children }: {
  open: boolean; title: string; body?: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal fadein">
        <h2>{title}</h2>
        {body && <p className="mute">{body}</p>}
        <div className="col" style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}

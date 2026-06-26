import { useState } from 'react';
import { useStore } from '../store';
import { useT, roleName, Stepper } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { CircleCropper } from '../components/CircleCropper';
import { ROLE_ORDER } from '../game/defaults';

export function Setup() {
  const t = useT();
  const setup = useStore((s) => s.setup);
  const roleDefs = useStore((s) => s.roleDefs);
  const roleIcons = useStore((s) => s.roleIcons);
  const setRoleIcon = useStore((s) => s.setRoleIcon);
  const clearRoleIcon = useStore((s) => s.clearRoleIcon);
  const [cropRole, setCropRole] = useState<string | null>(null);
  const setCount = useStore((s) => s.setCount);
  const setSeatName = useStore((s) => s.setSeatName);
  const setRoleCount = useStore((s) => s.setRoleCount);
  const doAssign = useStore((s) => s.doAssign);
  const go = useStore((s) => s.go);

  // ordered role list: builtins in canonical order, then customs
  const ordered = [...roleDefs].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.id);
    const bi = ROLE_ORDER.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // Non-citizen assigned roles; citizens auto-fill the rest.
  const nonCitizen = ordered.filter((r) => r.id !== 'citizen');
  const assignedNonCitizen = nonCitizen.reduce((sum, r) => sum + (setup.counts[r.id] ?? 0), 0);
  const citizensFill = Math.max(0, setup.count - assignedNonCitizen);
  const over = assignedNonCitizen > setup.count;

  return (
    <div className="screen fadein">
      <TopBar onBack={() => go('home')} />
      <h1 style={{ fontSize: 26 }}>{t('setup_title')}</h1>

      <div className="col" style={{ marginTop: 16 }}>
        <div className="role-row">
          <div className="meta"><div className="nm">{t('setup_count')}</div></div>
          <Stepper value={setup.count} min={3} max={30} onChange={setCount} />
        </div>

        <div className="field">
          <label>{t('setup_names')}</label>
          <div className="list">
            {Array.from({ length: setup.count }).map((_, i) => (
              <div className="name-bar" key={i}>
                <span className="name-seat">{i + 1}</span>
                <input
                  className="input"
                  placeholder={`${t('seat')} ${i + 1}`}
                  value={setup.names[i] ?? ''}
                  onChange={(e) => setSeatName(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: 18 }}>{t('setup_roles')}</h3>
            <span className={'mute'} style={{ fontSize: 13, color: over ? 'var(--danger)' : undefined }}>
              {assignedNonCitizen + citizensFill}/{setup.count} {t('setup_total')}
            </span>
          </div>
          {over && <div className="note" style={{ marginTop: 8, color: 'var(--danger)', borderColor: 'var(--danger)' }}>{t('setup_over')}</div>}
          <div className="list" style={{ marginTop: 10 }}>
            {ordered.map((r) => {
              const isCitizen = r.id === 'citizen';
              const value = isCitizen ? citizensFill : (setup.counts[r.id] ?? 0);
              return (
                <div className="role-row" key={r.id}>
                  <button onClick={() => setCropRole(r.id)} title={t('crop_title')}
                    style={{ background: 'none', padding: 0, lineHeight: 0, position: 'relative' }}>
                    <RoleArt roleId={r.id} size={36} />
                    <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: 12,
                      background: 'var(--panel2)', borderRadius: '50%', width: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>✎</span>
                  </button>
                  <div className="meta">
                    <div className="nm">{roleName(r, t)}</div>
                    <div className="tm">
                      {t(`team_${r.team}` as any)}{isCitizen ? ` · ${t('setup_citizensFill')}` : ''}
                      {roleIcons[r.id] && (
                        <> · <button onClick={() => clearRoleIcon(r.id)}
                          style={{ background: 'none', padding: 0, color: 'var(--lamp)', fontSize: 12 }}>↺ {t('icon_reset')}</button></>
                      )}
                    </div>
                  </div>
                  {isCitizen ? (
                    <span className="stepper-val" style={{ fontSize: 18 }}>{value}</span>
                  ) : (
                    <Stepper value={value} min={0} max={setup.count} onChange={(n) => setRoleCount(r.id, n)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="row" style={{ marginTop: 6 }}>
          <button className="toolbtn" onClick={() => go('roleCreator')}>＋ {t('setup_roleCreator')}</button>
          <button className="toolbtn" onClick={() => go('nightOrder')}>☾ {t('setup_nightOrder')}</button>
          <button className="toolbtn" onClick={() => go('settings')}>⚙ {t('setup_settings')}</button>
        </div>

        <button className="btn primary" style={{ marginTop: 8 }} disabled={over} onClick={doAssign}>
          {t('moveOn')} →
        </button>
      </div>

      {cropRole && (
        <CircleCropper
          title={t('crop_title')}
          onClose={() => setCropRole(null)}
          onSave={(url) => { setRoleIcon(cropRole, url); setCropRole(null); }}
        />
      )}
    </div>
  );
}

import { useStore } from '../store';
import { useT, roleName, Stepper } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { ROLE_ORDER } from '../game/defaults';

export function Setup() {
  const t = useT();
  const setup = useStore((s) => s.setup);
  const roleDefs = useStore((s) => s.roleDefs);
  const setCount = useStore((s) => s.setCount);
  const setNames = useStore((s) => s.setNames);
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
          <input
            className="input"
            placeholder={t('setup_names_ph')}
            defaultValue={setup.names.join(', ')}
            onChange={(e) => setNames(e.target.value)}
          />
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
                  <RoleArt roleId={r.id} size={36} />
                  <div className="meta">
                    <div className="nm">{roleName(r, t)}</div>
                    <div className="tm">{t(`team_${r.team}` as any)}{isCitizen ? ` · ${t('setup_citizensFill')}` : ''}</div>
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
    </div>
  );
}

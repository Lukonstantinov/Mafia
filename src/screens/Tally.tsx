import { useStore } from '../store';
import { useT, roleName, useRoleById } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { ROLE_ORDER } from '../game/defaults';

export function Tally() {
  const t = useT();
  const players = useStore((s) => s.players);
  const roleDefs = useStore((s) => s.roleDefs);
  const roleById = useRoleById();
  const doReshuffle = useStore((s) => s.doReshuffle);
  const startDealing = useStore((s) => s.startDealing);
  const go = useStore((s) => s.go);

  // aggregate counts only — does not reveal which seat holds which role
  const counts: Record<string, number> = {};
  for (const p of players) counts[p.roleId] = (counts[p.roleId] ?? 0) + 1;

  const present = roleDefs
    .filter((r) => counts[r.id] > 0)
    .sort((a, b) => {
      const ai = ROLE_ORDER.indexOf(a.id), bi = ROLE_ORDER.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return (
    <div className="screen fadein">
      <TopBar onBack={() => go('setup')} />
      <div className="center">
        <h1 style={{ fontSize: 28 }}>{t('tally_title')}</h1>
        <p className="mute">{t('tally_sub')}</p>
      </div>

      <div className="list" style={{ marginTop: 16 }}>
        {present.map((r) => (
          <div className="role-row" key={r.id}>
            <RoleArt roleId={r.id} size={36} />
            <div className="meta"><div className="nm">{roleName(roleById[r.id], t)}</div></div>
            <span className="cnt" style={{ color: 'var(--lamp)', fontWeight: 700 }}>
              {counts[r.id]}/{counts[r.id]}
            </span>
          </div>
        ))}
      </div>

      <div className="note center" style={{ marginTop: 16 }}>{t('instr_short')}</div>

      <div className="spacer" />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn ghost grow" onClick={doReshuffle}>⟲ {t('reshuffle')}</button>
        <button className="btn primary grow" onClick={startDealing}>{t('tally_startDealing')} →</button>
      </div>
    </div>
  );
}

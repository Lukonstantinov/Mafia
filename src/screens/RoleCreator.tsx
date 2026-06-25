import { useState } from 'react';
import { useStore } from '../store';
import { useT, Toggle } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import type { Team, RoleDef } from '../types';

const TEAMS: Team[] = ['mafia', 'town', 'neutral'];
const COLORS = ['#D8453E', '#3E84CC', '#41A877', '#C94F93', '#8F99AD', '#E7B45A', '#9B5DE5', '#F4A259'];

export function RoleCreator() {
  const t = useT();
  const addRole = useStore((s) => s.addRole);
  const go = useStore((s) => s.go);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('★');
  const [color, setColor] = useState('#9B5DE5');
  const [team, setTeam] = useState<Team>('neutral');
  const [actsAtNight, setActsAtNight] = useState(false);

  const preview: RoleDef = { id: 'preview', name, team, color, icon, actsAtNight, desc, builtin: false };

  const save = () => {
    if (!name.trim()) return;
    const role: RoleDef = {
      id: `role_${Date.now()}`,
      name: name.trim(),
      team,
      color,
      icon: icon.trim() || '★',
      actsAtNight,
      desc: desc.trim(),
      builtin: false,
    };
    addRole(role);
    go('setup');
  };

  return (
    <div className="screen fadein">
      <TopBar onBack={() => go('setup')} />
      <h1 style={{ fontSize: 24 }}>{t('rc_title')}</h1>

      <div className="center" style={{ margin: '14px 0' }}>
        <RoleArtPreview role={preview} />
      </div>

      <div className="col">
        <div className="field">
          <label>{t('rc_name')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('rc_desc')}</label>
          <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="row">
          <div className="field grow">
            <label>{t('rc_icon')}</label>
            <input className="input" maxLength={2} value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
          <div className="field grow">
            <label>{t('rc_team')}</label>
            <select className="input" value={team} onChange={(e) => setTeam(e.target.value as Team)}>
              {TEAMS.map((tm) => <option key={tm} value={tm}>{t(`team_${tm}` as any)}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>{t('rc_color')}</label>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: c,
                  border: color === c ? '3px solid var(--ink)' : '1px solid var(--line)',
                }} aria-label={c} />
            ))}
          </div>
        </div>
        <div className="role-row">
          <div className="meta"><div className="nm">{t('rc_actsAtNight')}</div></div>
          <Toggle on={actsAtNight} onChange={setActsAtNight} />
        </div>

        <button className="btn primary" disabled={!name.trim()} onClick={save}>{t('rc_save')}</button>
      </div>
    </div>
  );
}

function RoleArtPreview({ role }: { role: RoleDef }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <RoleArt roleId={undefined} color={role.color} size={84} />
      {/* preview uses color + icon directly via a transient render */}
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: role.color }}>
        {role.icon} {role.name || '—'}
      </span>
    </span>
  );
}

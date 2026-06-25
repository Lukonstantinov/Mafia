import { useStore } from '../store';
import { useT, roleName, useRoleById } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { PRESETS } from '../game/defaults';
import { RoleArt } from '../components/RoleArt';

export function Home() {
  const t = useT();
  const applyPreset = useStore((s) => s.applyPreset);

  return (
    <div className="screen fadein">
      <TopBar />
      <div className="eyebrow">{t('eyebrow')}</div>
      <h1 className="title-lg" style={{ margin: '6px 0 4px' }}>{t('brand')}</h1>
      <p className="mute" style={{ marginTop: 0 }}>{t('tagline')}</p>

      <div className="note" style={{ marginBottom: 18 }}>
        <strong style={{ color: 'var(--lamp)' }}>⚠ {t('instr_title')}</strong>
        <div style={{ marginTop: 6 }}>{t('instr_body')}</div>
      </div>

      <p className="mute" style={{ marginBottom: 12 }}>{t('home_pickPreset')}</p>

      <div className="col">
        <PresetCard id="classic" title={t('home_classic')} />
        <PresetCard id="starter" title={t('home_starter')} />
        <button className="card selectable" onClick={() => applyPreset('scratch')}>
          <div className="preset-card">
            <div className="head">
              <h3>{t('home_scratch')}</h3>
              <span style={{ fontSize: 22 }}>＋</span>
            </div>
            <span className="mute" style={{ fontSize: 13 }}>{t('home_scratch_sub')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function PresetCard({ id, title }: { id: 'classic' | 'starter'; title: string }) {
  const t = useT();
  const applyPreset = useStore((s) => s.applyPreset);
  const roleById = useRoleById();
  const preset = PRESETS[id];
  const entries = Object.entries(preset.counts).filter(([, n]) => n > 0);
  return (
    <button className="card selectable" onClick={() => applyPreset(id)}>
      <div className="preset-card">
        <div className="head">
          <h3>{title}</h3>
          <span className="cnt">{preset.count} {t('home_players')}</span>
        </div>
        <div className="chips">
          {entries.map(([rid, n]) => (
            <span className="chip" key={rid} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <RoleArt roleId={rid} size={18} />
              {n}× {roleName(roleById[rid], t)}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

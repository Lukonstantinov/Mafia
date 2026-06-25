import { useStore } from '../store';
import { useT, roleName, Toggle, Stepper } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';

export function Settings() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const roleDefs = useStore((s) => s.roleDefs);
  const setSettings = useStore((s) => s.setSettings);
  const go = useStore((s) => s.go);

  const actingRoles = roleDefs.filter((r) => r.actsAtNight);

  return (
    <div className="screen fadein">
      <TopBar onBack={() => go('setup')} />
      <h1 style={{ fontSize: 24 }}>{t('set_title')}</h1>

      <h3 style={{ fontSize: 16, marginTop: 18 }}>{t('set_actions')}</h3>
      <div className="list" style={{ marginTop: 10 }}>
        {actingRoles.map((r) => (
          <div className="role-row" key={r.id}>
            <RoleArt roleId={r.id} size={32} />
            <div className="meta"><div className="nm">{roleName(r, t)}</div></div>
            <Stepper
              value={settings.actionsPerRole[r.id] ?? 1}
              min={1} max={5}
              onChange={(n) => setSettings({ actionsPerRole: { ...settings.actionsPerRole, [r.id]: n } })}
            />
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginTop: 20 }}>{t('set_title')}</h3>
      <div className="list" style={{ marginTop: 10 }}>
        <SettingRow label={t('set_doctorSelfHeal')} on={settings.doctorSelfHeal} onChange={(v) => setSettings({ doctorSelfHeal: v })} />
        <SettingRow label={t('set_mafiaRatio')} on={settings.mafiaWinRatioEqual} onChange={(v) => setSettings({ mafiaWinRatioEqual: v })} />
        <SettingRow label={t('set_townLast')} on={settings.townWinLastMafia} onChange={(v) => setSettings({ townWinLastMafia: v })} />
        <SettingRow label={t('set_story')} on={settings.storyEnabled} onChange={(v) => setSettings({ storyEnabled: v })} />
        <SettingRow label={t('set_log')} on={settings.logEnabled} onChange={(v) => setSettings({ logEnabled: v })} />
      </div>

      <div className="spacer" />
      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => go('setup')}>{t('done')}</button>
    </div>
  );
}

function SettingRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="role-row">
      <div className="meta"><div className="nm" style={{ fontWeight: 500 }}>{label}</div></div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
